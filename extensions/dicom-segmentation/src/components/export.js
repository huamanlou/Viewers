//nickfu export segmentations

import cornerstoneTools from 'cornerstone-tools';
import cornerstone from 'cornerstone-core';
import * as dcmjs from 'dcmjs';
import { utils, log } from '@ohif/core';
const { studyMetadataManager } = utils;


//将frame数据转化成dicom下载路径
// http://118.190.76.120:8077/orthanc/wado?objectUID=1.2.840.113619.2.244.6945.3553798.23132.1275611655.854&contentType=application%2Fdicom&requestType=WADO
const dicomPath = (url) =>{
  let reg = /instances.*frames/;
  let res = url.match(reg);
  if(res && res.length==1){
    let _arr = res[0].split('/');
    // http://118.190.76.120:8077/orthanc/wado?objectUID=1.2.840.113619.2.244.6945.3553798.23132.1275611655.854&contentType=application%2Fdicom&requestType=WADO
    return `dicomweb://118.190.76.120:8077/orthanc/wado?objectUID=${_arr[1]}&contentType=application%2Fdicom&requestType=WADO`;
  }
  return false;
}

export const exportSeg = (studies, viewports, activeIndex) => {
    console.log('xxxxxx',studies,viewports,activeIndex);
    var title = window.prompt("请输入segments 标题","Segments") 
    if(!title){
      alert('已取消');
      return;
    }

    // const activeViewport = viewports[activeIndex];

    // console.log('aaaa',activeViewport);

    const element = document.getElementsByClassName("viewport-element")[0];
    const globalToolStateManager = cornerstoneTools.globalImageIdSpecificToolStateManager;
    const toolState = globalToolStateManager.saveToolState();

    const stackToolState = cornerstoneTools.getToolState(element, "stack");
    let oldIds = stackToolState.data[0].imageIds;

    console.log('oldIds',oldIds)
    let imageIds = [];
    oldIds.forEach(item => {
      let url = dicomPath(item);
      if(!url){
        alert(`${item} 路径异常`);
        return;
      }
      imageIds.push(url)
    })

    // let imageIds = [
    //   'dicomweb://s3.amazonaws.com/lury/PTCTStudy/1.3.6.1.4.1.25403.52237031786.3872.20100510032220.11.dcm',
    //   'dicomweb://s3.amazonaws.com/lury/PTCTStudy/1.3.6.1.4.1.25403.52237031786.3872.20100510032220.12.dcm'
    // ]

    // http://118.190.76.120:8077/orthanc/wado?objectUID=1.2.840.113619.2.244.6945.3553798.23132.1275611655.854&contentType=application%2Fdicom&requestType=WADO
    // imageIds = [
    //   'dicomweb://118.190.76.120:8077/dcm/SE000000.dcm',
    //   'dicomweb://118.190.76.120:8077/dcm/SE000001.dcm',
    //   'dicomweb://118.190.76.120:8077/dcm/SE000002.dcm',
    //   'dicomweb://118.190.76.120:8077/dcm/SE000003.dcm',
    //   'dicomweb://118.190.76.120:8077/dcm/SE000004.dcm',
    //   'dicomweb://118.190.76.120:8077/dcm/SE000005.dcm',
    //   'dicomweb://118.190.76.120:8077/dcm/SE000006.dcm',
    //   'dicomweb://118.190.76.120:8077/dcm/SE000007.dcm',
    //   'dicomweb://118.190.76.120:8077/dcm/SE000008.dcm',
    //   'dicomweb://118.190.76.120:8077/dcm/SE000009.dcm',
    //   'dicomweb://118.190.76.120:8077/dcm/SE000010.dcm',
    //   'dicomweb://118.190.76.120:8077/dcm/SE000011.dcm',
    //   'dicomweb://118.190.76.120:8077/dcm/SE000012.dcm',
    //   'dicomweb://118.190.76.120:8077/dcm/SE000013.dcm',
    //   'dicomweb://118.190.76.120:8077/dcm/SE000014.dcm',
    // ]

    console.log('aaaaa',imageIds)

    let imagePromises = [];
    for (let i = 0; i < imageIds.length; i++) {
      imagePromises.push(cornerstone.loadImage(imageIds[i]));
    }

    const segments = [];

    const { getters } = cornerstoneTools.getModule('segmentation');
    const { labelmaps3D } = getters.labelmaps3D(element);

    console.log('labelmaps3D',labelmaps3D)

    if (!labelmaps3D) {
      return;
    }

        
    for (let labelmapIndex = 0; labelmapIndex < labelmaps3D.length; labelmapIndex++) {
      const labelmap3D = labelmaps3D[labelmapIndex];
      const labelmaps2D = labelmap3D.labelmaps2D;

      for (let i = 0; i < labelmaps2D.length; i++) {
        if (!labelmaps2D[i]) {
          continue;
        }
        const segmentsOnLabelmap = labelmaps2D[i].segmentsOnLabelmap;
        segmentsOnLabelmap.forEach(segmentIndex => {
          if (segmentIndex !== 0 && !labelmap3D.metadata[segmentIndex]) {
            // labelmap3D.metadata[segmentIndex] = generateMockMetadata(segmentIndex)
            labelmap3D.metadata[segmentIndex] = generateMockMetadata(segmentIndex,title)
          }
        });
      }
    }
    //反转一下试试
    labelmaps3D.reverse();

    Promise.all(imagePromises).then(images => {
      console.log('cccccc',images,labelmaps3D)
      const segBlob = dcmjs.adapters.Cornerstone.Segmentation.generateSegmentation(images,labelmaps3D);
      //Create a URL for the binary.
      console.log('dddddd',segBlob)
      var objectUrl = URL.createObjectURL(segBlob);
      window.open(objectUrl);
    }).catch(err => {
      console.log(err)
    });
}


const generateMockMetadata = (segmentIndex,title) => {
  // TODO -> Use colors from the cornerstoneTools LUT.
  const RecommendedDisplayCIELabValue = dcmjs.data.Colors.rgb2DICOMLAB([
    1,
    0,
    0
  ]);
  let segmentTitle = title || 'Segments'
  return {
    SegmentedPropertyCategoryCodeSequence: {
      CodeValue: "T-D0050",
      CodingSchemeDesignator: "SRT",
      CodeMeaning: segmentTitle
    },
    SegmentNumber: (segmentIndex + 1).toString(),
    SegmentLabel: segmentTitle+ ' ' + (segmentIndex + 1).toString(),
    SegmentAlgorithmType: "SEMIAUTOMATIC",
    SegmentAlgorithmName: "Slicer Prototype",
    RecommendedDisplayCIELabValue,
    SegmentedPropertyTypeCodeSequence: {
      CodeValue: "T-D0050",
      CodingSchemeDesignator: "SRT",
      CodeMeaning: segmentTitle
    }
  };
}
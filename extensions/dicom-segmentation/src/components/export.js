//nickfu export segmentations

import cornerstoneTools from 'cornerstone-tools';
import cornerstone from 'cornerstone-core';
import * as dcmjs from 'dcmjs';
import { utils, log } from '@ohif/core';
const { studyMetadataManager } = utils;

const orthancUrl = `//118.190.76.120:8077/orthanc`;

//将frame数据转化成dicom下载路径
// http://118.190.76.120:8077/orthanc/wado?objectUID=1.2.840.113619.2.244.6945.3553798.23132.1275611655.854&contentType=application%2Fdicom&requestType=WADO
const dicomPath = (url) =>{
    let reg = /instances.*frames/;
    let res = url.match(reg);
    if(res && res.length==1){
        let _arr = res[0].split('/');
        // http://118.190.76.120:8077/orthanc/wado?objectUID=1.2.840.113619.2.244.6945.3553798.23132.1275611655.854&contentType=application%2Fdicom&requestType=WADO
        return `dicomweb:${orthancUrl}/wado?objectUID=${_arr[1]}&contentType=application%2Fdicom&requestType=WADO`;
    }
    return false;
}

export const exportSeg = ({studies, viewports, activeIndex, save=false}={}) => {
    // console.log('xxxxxx',studies,viewports,activeIndex);
    // return;
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

    Promise.all(imagePromises).then(async (images) => {
        console.log('cccccc',images,labelmaps3D)
        const segBlob = dcmjs.adapters.Cornerstone.Segmentation.generateSegmentation(images,labelmaps3D);
        //Create a URL for the binary.
        console.log('dddddd',segBlob)
        if(!save){ //下载
            var objectUrl = URL.createObjectURL(segBlob);
            window.open(objectUrl);
        }else{//保存
            let res = await fetchData({
                url:`http://${orthancUrl}/instances`,
                binaryData: segBlob
            });
        }

    }).catch(err => {
      console.log(err)
    });
}
const fetchData = async function({url,binaryData,method='POST'}={}){
    return new Promise((resolve,reject)=>{
        fetch(url, {
            // body: JSON.stringify(data), // must match 'Content-Type' header
            body: binaryData,
            // cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
            // credentials: 'same-origin', // include, same-origin, *omit
            headers: {
                // 'user-agent': 'Mozilla/4.0 MDN Example',
                // 'content-type': 'application/json'
                'Expect':'',
            },
            method, // *GET, POST, PUT, DELETE, etc.
            // mode: 'cors', // no-cors, cors, *same-origin
            // redirect: 'follow', // manual, *follow, error
            // referrer: 'no-referrer', // *client, no-referrer
        }).then(response => {
            // response.json()
            console.log('xxxx',response)
            resolve(response)
        }).catch(e=>{
            reject(e)
        })
    })
    

}
export const deleteSeg = async (studies,activeIndex)=>{
    var r = confirm('确定删除该study所有seg');
    if (!r) {
      return;
    }

    console.log('ssss',activeIndex,studies)
    let instances = [];
    studies[activeIndex].series.forEach(item=>{
        if(item.Modality=='SEG'){
            instances.push(item.instances[0].wadouri);
        }
    })
    console.log('zzzzz',instances)
    let listPromise = instances.map((item)=>{
        let res = fetchData({
            url:item,
            binaryData:'',
            method:'DELETE'
        })
    })
    let res = await Promise.all(listPromise)
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
//nickfu export segmentations

import cornerstoneTools from 'cornerstone-tools';
import cornerstone from 'cornerstone-core';
import * as dcmjs from 'dcmjs';
import { utils, log } from '@ohif/core';
const { studyMetadataManager } = utils;

export const exportSeg = (studies, viewports, activeIndex) => {
    console.log('xxxxxx',studies,viewports,activeIndex);


    // const activeViewport = viewports[activeIndex];

    // console.log('aaaa',activeViewport);

    const element = document.getElementsByClassName("viewport-element")[0];
    const globalToolStateManager = cornerstoneTools.globalImageIdSpecificToolStateManager;
    const toolState = globalToolStateManager.saveToolState();

    const stackToolState = cornerstoneTools.getToolState(element, "stack");
    const imageIds = stackToolState.data[0].imageIds;

    console.log('bbbbb',imageIds)

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
            labelmap3D.metadata[segmentIndex] = generateMockMetadata(segmentIndex)
          }
        });
      }
    }

    Promise.all(imagePromises).then(images => {
      console.log('cccccc',images,labelmaps3D)
      const segBlob = dcmjs.adapters.Cornerstone.Segmentation.generateSegmentation(images,labelmaps3D);
      //Create a URL for the binary.
      var objectUrl = URL.createObjectURL(segBlob);
      window.open(objectUrl);
    }).catch(err => {
      console.log(err)
    });
}


const generateMockMetadata = (segmentIndex) => {
  // TODO -> Use colors from the cornerstoneTools LUT.
  const RecommendedDisplayCIELabValue = dcmjs.data.Colors.rgb2DICOMLAB([
    1,
    0,
    0
  ]);

  return {
    SegmentedPropertyCategoryCodeSequence: {
      CodeValue: "T-D0050",
      CodingSchemeDesignator: "SRT",
      CodeMeaning: "Tissue"
    },
    SegmentNumber: (segmentIndex + 1).toString(),
    SegmentLabel: "Tissue " + (segmentIndex + 1).toString(),
    SegmentAlgorithmType: "SEMIAUTOMATIC",
    SegmentAlgorithmName: "Slicer Prototype",
    RecommendedDisplayCIELabValue,
    SegmentedPropertyTypeCodeSequence: {
      CodeValue: "T-D0050",
      CodingSchemeDesignator: "SRT",
      CodeMeaning: "Tissue"
    }
  };
}
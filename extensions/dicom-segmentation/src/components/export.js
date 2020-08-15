//nickfu export segmentations

import cornerstoneTools from 'cornerstone-tools';
import cornerstone from 'cornerstone-core';
import * as dcmjs from 'dcmjs';
import { utils, log } from '@ohif/core';
import './jquery.min.js';
import './opencpu-0.4.js';
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
const showTips = (msg)=>{
    let topTips = document.getElementById('topTips');
    console.log('zzzzz',topTips)
    topTips.innerHTML = msg || '数据处理中……';
    topTips.style.display = 'block';
}
const closeTips = ()=>{
    let topTips = document.getElementById('topTips');
    console.log('zzzzz',topTips)
    topTips.innerHTML = '';
    topTips.style.display = 'none';
}

export const exportSeg = ({studies, viewports, activeIndex, save=false}={}) => {
    // console.log('xxxxxx',studies,viewports,activeIndex);
    // return;
    
    var title = window.prompt("请输入segments 标题","Segments") 
    if(!title){
        alert('已取消');
        return;
    }
    showTips();

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
            window.location.reload();
        }
        closeTips();

    }).catch(err => {
      console.log(err)
      closeTips();
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
// export const deleteSeg = async (studies,activeIndex)=>{
//     var r = confirm('确定删除该study所有seg');
//     if (!r) {
//       return;
//     }

//     console.log('ssss',activeIndex,studies)
//     let instances = [];
//     studies[activeIndex].series.forEach(item=>{
//         if(item.Modality=='SEG'){
//             instances.push(item.instances[0].wadouri);
//         }
//     })
//     console.log('zzzzz',instances)
//     let listPromise = instances.map((item)=>{
//         let res = fetchData({
//             url:item,
//             binaryData:'',
//             method:'DELETE'
//         })
//     })
//     let res = await Promise.all(listPromise)
// }

export const statistics = async({studies, viewports, activeIndex}={})=>{
    showTips();
    console.log('statistics',studies,viewports,activeIndex);
    let SeriesInstanceUID = viewports[activeIndex].SeriesInstanceUID;
    let SeriesDescription = viewports[activeIndex].SeriesDescription;
    console.log('SeriesInstanceUID',SeriesInstanceUID,SeriesDescription);
    let imgs = [];
    studies[0].seriesMap[SeriesInstanceUID].instances.forEach(item=>{
        imgs.push(item.wadouri);
    })
    console.log('imgs',imgs);
    let segs = [];
    studies[0].series.forEach(item=>{
        let instance = item.instances[0];
        if(item.Modality=='SEG' && instance.metadata.ReferencedSeriesSequence.SeriesInstanceUID==SeriesInstanceUID){
            segs.push(instance.wadouri);
        }
    })
    console.log('segs',segs);

    let data = {
        img: imgs,
        seg: segs,
        batch: 'CFS'
    }
    if(SeriesDescription.indexOf('T2')>-1){
        data.batch = 'T2';
    }

    let res = await ocpuReq(data,'predictURL');
    resDeal(res,SeriesDescription);
    closeTips();
}
const resDeal = (res,desc)=>{
    let str = '';
    res.forEach((item,index)=>{
        if(item.label=='4'){
            str = str + `${index}：以[${desc}]序列病变标注预测，病变恶性上皮肿瘤可能性大，概率${item.prob*100}%\n`;

        }else if(item.label=='3'){
            str = str + `${index}：以[${desc}]序列病变标注预测，病变良性上皮肿瘤可能性大，概率${item.prob*100}%\n`;
        }
    })
    alert(str);
}
const ocpuHost = ()=>{
    if(window.location.hostname=='localhost' || window.location.hostname=='118.190.76.120'){
        return 'http://114.215.42.1/ocpu';
    }else{
        return 'http://192.168.68.152/ocpu';
    }
}

const ocpuReq = async (data,func)=>{
    return new Promise((resolve,reject)=>{
        if(window.location.hostname=='localhost' || window.location.hostname=='118.190.76.120'){
            var R_Url = `${ocpuHost()}/library/medRadiomics/R`;
        }else{
            var R_Url = `${ocpuHost()}/library/medRadiomics/R`;
        }
        ocpu.seturl(R_Url);

        let req = ocpu.rpc(func,data, function(output){
            console.log('rpc output',output)
            resolve(output);
        });

        req.fail(function(){
            alert("R returned an error: " + req.responseText);
            reject(req.responseText);
        });
    })

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
import { LightningElement, api, track } from 'lwc';
import getBlobList from '@salesforce/apex/GetAllContainersAndBlobs.getBlobList';
const columns = [
    { label: 'Type', fieldName: 'contentType', type: 'image', hideDefaultActions: true,initialWidth:10,cellAttributes:{iconName:{fieldName:'iconName'}}},
    { label: 'Name', fieldName: 'Name', type: 'text' },
    { label: 'Created', fieldName: 'createdTime', type: 'text', hideDefaultActions: true,initialWidth:105 },
    { label: 'Modified', fieldName: 'lastModified', type: 'text', hideDefaultActions: true,initialWidth:105 },
    { label: 'Size', fieldName: 'contentLength', type: 'number' ,hideDefaultActions: true,initialWidth:80,cellAttributes:{alignment:'left'} },
];

export default class AzureDataTable extends LightningElement {
    @api recordId;
    @api objectApiName;  
    @track recordsToDisplay = []; //contains the total records
    //data = [];
    visibleRecs;       //contains the sliced records after Pagination
    columns = columns;
    connectedCallback(){
        this.initData();
    }

    initData(){
        getBlobList({recordId: this.recordId, objectApiName: this.objectApiName}).then(result=>{
            //this.data = result;
            this.recordsToDisplay = result;
            var ValueSet = {itemName:this.data.Name}
            var names = this.showIcons(ValueSet);
            return {...item,            
                "iconName":names
              }
    });
    } 

    /* Method used to display the records in datatable after recieving the value from the child component - pagination */
    updateHandler(event){
      this.visibleRecs = [...event.detail.records];
    }
    showIcons(Valueset){
        let iconName;
        var tempName = Valueset.itemName;
        var itemDownloadURL = Valueset.itemURL;
        tempName = tempName.split('.');
        var ext = tempName[(tempName.length-1)];
        if(itemDownloadURL != undefined){
          if(ext == 'txt'){
            iconName = "doctype:txt"
          }else if(ext == 'csv'){
            iconName = "doctype:csv"
          }else if(ext == 'docx'){
            iconName = "doctype:word"
          }else if(ext == 'pptx' || ext == 'ppt' ){
            iconName = "doctype:ppt"
          }else if(ext == 'exe' ){
            iconName = "doctype:exe"
          }else if(ext == 'zip' ){
            iconName = "doctype:zip"
          }else if(ext == 'eps'){
            iconName = "doctype:eps"
          }else if(ext == 'xlsx' || ext == 'xls' ){
            iconName = "doctype:excel"
          }else if(ext == 'tif' || ext == 'tiff' || ext == 'png' || ext == 'jpeg' || ext == 'jpg' || ext == 'gif' ){
            iconName = "doctype:image"
          }else if(ext == 'html' ){
            iconName = "doctype:html"
          }else if(ext == 'pdf' ){
            iconName = "doctype:pdf"
          }else{
            iconName = "doctype:unknown";
          }
        }else{
          iconName = "doctype:folder";
        }
        return iconName;
      }
}
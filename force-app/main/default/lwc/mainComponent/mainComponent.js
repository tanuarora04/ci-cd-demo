import { LightningElement, api,track,wire } from 'lwc';
import setupNewFolder from '@salesforce/apex/ServicesCalloutToSharePoint.setupNewFolder' ; //importing the setupNewFolder method from ServicesCalloutToShairePoint
import getAllFolder from '@salesforce/apex/ServicesCalloutToSharePoint.getAllFolder'; //importing the getAllFolder method from ServicesCalloutToSharePoint for getting all the folders in the drive
import getAllFiles from '@salesforce/apex/ServicesCalloutToSharePoint.getAllFiles'; //importing the getAllFiles method to get all the file associated with the folder chosen 
import renameFolder from '@salesforce/apex/ServicesCalloutToSharePoint.renameFolder'; //importing the rename folder method
import deleteFolder from '@salesforce/apex/ServicesCalloutToSharePoint.deleteFolder'; //importing the delete folder method
import checkSharePointFolderId from '@salesforce/apex/ServicesCalloutToSharePoint.checkSharePointFolderId';
import ASCLogo from '@salesforce/resourceUrl/ASCLogo';
import {ShowToastEvent} from 'lightning/platformShowToastEvent'; // to display success and error messages
import {refreshApex} from '@salesforce/apex'; //to refresh pages
import {showIcons} from 'c/utilityJS';

//specify the actions that are required in the drop-down with the associated properties or attributes 
const actions = [
    { iconName: 'utility:edit',label: 'Rename', name: 'edit',iconPosition:'left' },
    { label: 'Download', name: 'download', iconName: 'utility:download'},
    { label: 'Open in SharePoint', name: 'open_sp', iconName: 'utility:new_window' },
    { label: 'Delete', name: 'delete', iconName: 'utility:delete'}
];

//specify the columns that are required in the data table with the associated properties or attributes
const columns=[
  {label:'Type',fieldName:'Type',type:'image',hideDefaultActions: true,initialWidth:10,cellAttributes:{iconName:{fieldName:'iconName'}}},
  {label:'Name',fieldName:'name',type:'button',
      typeAttributes:{
          label:{fieldName:'name'},
          variant:'base',
          horizontalAlign:'start'
      },
      hideDefaultActions: true
  },
  {label:'Created',fieldName:'createdDateTime',type:'text',hideDefaultActions: true,initialWidth:105},
  {label:'Last Modified',fieldName:'lastModifiedDateTime',type:'text',hideDefaultActions: true,initialWidth:105},
  {label:'Size',fieldName:'size',type:'number',hideDefaultActions: true,initialWidth:80,cellAttributes:{alignment:'left'}},
  {label:'',fieldName:'Action',hideDefaultActions: true,type: 'action',
      typeAttributes: {
          rowActions: actions,
          menuAlignment: 'auto',
      }
  } 
];

const DELAY = 300;

export default class mainComponent extends LightningElement {

  @track deleteFoldername;
  @track renamefolderId;
  myBreadcrumbs = [];
  @track myBreadcrumb = this.myBreadcrumbs;
  @track deletefolderId;
  @api recordId;
  @track showLoadingSpinner = false;
  @track showDataTableSpinner = false;
  @track sharePointFolderId;            
  @track selectedFolder;
  @track renamedvalue;               
  @track showSetup = false;
  @track showPagination = false;
  @api objectApiName;
  @track columns = columns;
  @track selectedItem;
  uploadFileModal = false;
  @api docPathURL;
  recordList;
  @track searchBar = [];
  @track searchResults = [];
  closedModel = false;
  @track totalRec = [];
  newFolderName;
  @track ASC_logo;
  reNameModel = false; 
  deleteModel = false;
  totalPage;
  @track pageNo;
  @track showError = true;
  recordsPerPage = 5; 
  @track recordToDisplay;
  

  // Connected Call Back Method Used : recordId, objectApiName
  connectedCallback() {
    checkSharePointFolderId({currentPageId: this.recordId, objectApiName: this.objectApiName})
      .then(result=>{
        this.showSetup = result[0].folderSetup;
        this.sharePointFolderId = result[0].sharePointFolderId;
        this.ASC_logo = (result[0].customLogo != null) ? result[0].customLogo : ASCLogo;
      }).catch(error => {
        console.log('-------------------ERROR-------------'+error);
    });

      this.initData();

  }

  initData(){
    getAllFolder({recordId: this.recordId, objectApiName: this.objectApiName}).then(result=>{
      if(result != null){
        this.recordList          = result;
        this.sharePointFolderId  = result[0].sharePointFolderId;
        this.selectedFolder      = this.sharePointFolderId;
        this.searchBar           = this.recordList;
        this.docPathURL          = result[0].docPath; 
        this.totalRec            = result;
        this.ASC_logo = (result[0].customLogo != null) ? result[0].customLogo : ASCLogo;
        var obj = { 
          label: result[0].recordName,
          name:  this.sharePointFolderId, 
          id:    this.sharePointFolderId
        };
        if(this.myBreadcrumb == ''){  
          this.myBreadcrumbs.push(obj);
        }
        if(result[0].name != undefined){
          this.recordToDisplay = this.recordList;
          this.setRecordsToDisplay();
        }else{
          this.recordToDisplay = [];
        }
    }});
  }

  


  /* Method called when data is to be displayed in the data table */
  setRecordsToDisplay(){
    if(this.recordList.length > 5 ){
      this.showPagination = true;
      //this.noRecordsToDisplay = false;
      this.pageNo = 1;
      this.totalPage = Math.ceil(this.recordList.length/this.recordsPerPage);
      this.preparePaginationList();
    }else if(this.recordList.length == 0){
      //this.noRecordsToDisplay = true;
      this.showPagination = false;
      this.totalPage = 0;
      this.pageNo = 0;
      this.recordToDisplay = [];
    }else if(this.recordList.length > 0 && this.recordList.length <= 5){
      //this.noRecordsToDisplay = false;
      this.showPagination = false;
      this.pageNo = 1;
      this.totalPage = 1;
      this.recordToDisplay = this.recordList.map(item=>{
        return {...item,            
          "iconName":showIcons({itemName:item.name,itemURL :item.downloadURL})
        }
      });
    }
  }

  /* Method called to prepare the Pagination List */
  preparePaginationList(){
    let begin = (this.pageNo - 1) * parseInt(this.recordsPerPage);
    let end = parseInt(begin) + parseInt(this.recordsPerPage);
    this.recordToDisplay = this.recordList.slice(begin,end).map(item=>{
      return {...item,            
          "iconName":showIcons({itemName:item.name,itemURL :item.downloadURL})
        }
    });
    this.searchBar = this.recordList;
    window.clearTimeout(this.delayTimeout);
    this.delayTimeout = setTimeout(()=>{
      this.disableEnableActions();
    },DELAY);
  }

  /* Method controls the disabling or enabling the previous and next button */
  disableEnableActions(){
    let buttons = this.template.querySelectorAll('lightning-button');
    buttons.forEach(bun =>{
      if(bun.label === 'Previous'){
        bun.disabled = this.pageNo === 1 ? true : false;
      }else if(bun.label === 'Next'){
        bun.disabled = this.pageNo === this.totalPage ? true : false;
      }
    });
  }

  /* Handles the pageNo on click of previous or next button */
  handleClickButtons(event){
    let label = event.target.label;
    if(label === 'Previous'){
      this.pageNo -=1;
    }else if(label === 'Next'){
      this.pageNo +=1;
    }
    this.preparePaginationList();
  }

  /* getter method called when recordsToDisplay is empty */
  get noRecordsToDisplay(){
    if(this.recordToDisplay == ''){
      return true;
    }
  }

  /* Getting the Response from the newFolder Component */
  handleCreateFolderResponseValue(event){
    this.totalRec = (this.totalRec.length == 1 && this.totalRec[0].folderSetup == true) ? [...event.detail.newFolderRecord] : [...event.detail.newFolderRecord,...this.recordList];
    this.recordList = this.totalRec;
    this.searchBar = this.totalRec;
    refreshApex(this.recordToDisplay);
    this.setRecordsToDisplay();
    this.closedModel= event.detail.modal;
  }

  /* Getting the Response from the uploadFileOrchestration Component */
  handleUploadFileResponseValue(event){ 
    this.totalRec = (this.totalRec.length == 1 && this.totalRec[0].folderSetup == true) ? [...event.detail.fileRecord] : [...event.detail.fileRecord,...this.totalRec];
    this.searchBar = this.totalRec;
    this.recordList = this.searchBar;
    this.recordToDisplay= this.recordList;
    this.setRecordsToDisplay();
    refreshApex( this.recordToDisplay);
    this.uploadFileModal=event.detail.modal;
  }

  /* Getting the Response from the uploadFileOrchestration Component */
  handleUploadFileCloseModalValue(event){
    this.uploadFileModal = event.detail;
  }

  /* Getting the Response from the newFolder Component */
  handleFolderCloseModalValue(event){
    this.closedModel = event.detail;
  }

  /*Getting the Response from the search Component*/
  hanldeProgressValueChange(event){
    this.searchResults = event.detail.searchResult;
    if(this.searchResults != '' && this.searchResults != 1 ){ 
      this.recordList = this.searchResults;
    }else if(this.searchResults == ''){
      this.recordList = this.totalRec;
    }else if(this.searchResults.valueOf() == 1){
      this.recordList = [];
    }
    this.setRecordsToDisplay();
    return refreshApex(this.recordToDisplay);

  }

    
  //onclick method to call when Get Folder Name for  Nem folder/Rename folder
  handleTextChange(event){
    this.newFolderName = event.target.value;
    this.showError = true;
  }

  //onclick method to call when Rename Folder Name for Rename folder
  renameMethod(event){  
    this.showLoadingSpinner = true;
    if(this.newFolderName != undefined && this.newFolderName != ''){
      this.totalRec.filter((currentItem) =>{
        if(currentItem.name == this.newFolderName){
          this.showError = false;
        }
      })
    }
    if(this.newFolderName != undefined && this.newFolderName != '' && this.showError){
      renameFolder({ renameValue: this.newFolderName,renameId : this.renamefolderId})
      .then(result=>{   
          this.reNameModel = false;
          let recordsPush = [];
          let i;
          let today = new Date();
          let dd = String(today.getDate()).padStart(2, '0');
          let mm = String(today.getMonth() + 1).padStart(2, '0'); 
          let yyyy = today.getFullYear();
          today = dd + '-' + mm + '-' + yyyy;
          if(result != ''){
            for(i = 0 ; i < this.recordToDisplay.length; i++ ){ 
              if(this.recordToDisplay[i].Id == result.Id){
                recordsPush.push({createdDateTime : result.createdDateTime, Id :result.Id , lastModifiedDateTime : today, name : this.newFolderName, size : result.size,webUrl : result.webUrl, downloadURL : result.downloadURL });
              }else{
                recordsPush.push({createdDateTime : this.recordToDisplay[i].createdDateTime, Id :this.recordToDisplay[i].Id , lastModifiedDateTime :this.recordToDisplay[i].lastModifiedDateTime, name : this.recordToDisplay[i].name, size : this.recordToDisplay[i].size,webUrl : this.recordToDisplay[i].webUrl,downloadURL : this.recordToDisplay[i].downloadURL });
              }
            }
            var renameDisplay = [];
            for(i = 0 ; i < this.totalRec.length; i++ ){ 
              if(this.totalRec[i].Id == result.Id){
                renameDisplay.push({createdDateTime : this.totalRec[i].createdDateTime, Id :this.totalRec[i].Id , lastModifiedDateTime : today, name : this.newFolderName, size : this.totalRec[i].size,webUrl : this.totalRec[i].webUrl,downloadURL : this.totalRec[i].downloadURL });
              }else{
                renameDisplay.push({createdDateTime : this.totalRec[i].createdDateTime, Id :this.totalRec[i].Id , lastModifiedDateTime :this.totalRec[i].lastModifiedDateTime, name : this.totalRec[i].name, size : this.totalRec[i].size,webUrl : this.totalRec[i].webUrl, downloadURL : this.totalRec[i].downloadURL });
              }
            }
            this.totalRec = renameDisplay;
            this.recordToDisplay = recordsPush.map(item=>{
              return {...item,            
                "iconName":showIcons({itemName:item.name,itemURL :item.downloadURL})
              }
            });
            this.searchBar = this.totalRec;
            this.recordList = this.totalRec;
            refreshApex(this.recordToDisplay); 
          }
            this.dispatchEvent(new ShowToastEvent({title: 'Success!!',message: ' Renamed to ' +this.newFolderName +' successfully!.',variant: 'success'}),);
            this.showLoadingSpinner = false; 
          }).catch(error=>{        
              this.dispatchEvent(new ShowToastEvent({title: 'Error!!',message: 'Error occured in renaming!.',variant: 'error'}),);});
    }else{
      if(this.newFolderName == ''){
        this.dispatchEvent(new ShowToastEvent({title: 'Error',message: 'Please enter the file/folder name',variant: 'error'}),);
        this.showLoadingSpinner = false; 
      }else{
      this.dispatchEvent(new ShowToastEvent({title: 'Error',message: 'This file/folder already exists. Please change the name',variant: 'error'}),);
      this.showLoadingSpinner = false; 
      }
    }
  }

  //onclick method to call when Delete Folder or File
  deleteMethod(event){ 
    this.showLoadingSpinner = true;
    deleteFolder({ deletefolderId : this.deletefolderId})
    .then(result=>{
        this.deleteModel = false;
        if(result == null){
          this.dispatchEvent(new ShowToastEvent({title: 'Success!!',message: this.deleteFoldername+' is deleted successfully!.',variant: 'success'}),);
          let i;
          let deletePush=[];
          let allrecs = [];
          if(this.deletefolderId != null){
            for(i = 0; i < this.recordToDisplay.length; i++){
              if(this.recordToDisplay[i].Id != this.deletefolderId){
                deletePush.push({createdDateTime : this.recordToDisplay[i].createdDateTime, Id :this.recordToDisplay[i].Id , lastModifiedDateTime :this.recordToDisplay[i].lastModifiedDateTime, name : this.recordToDisplay[i].name, size : this.recordToDisplay[i].size,webUrl : this.recordToDisplay[i].webUrl,downloadURL : this.recordToDisplay[i].downloadURL });
              }
            } 
            for(i = 0; i < this.totalRec.length; i++){
              if(this.totalRec[i].Id != this.deletefolderId && this.totalRec[i].Id != undefined){                          
                allrecs.push({createdDateTime : this.totalRec[i].createdDateTime, Id :this.totalRec[i].Id , lastModifiedDateTime :this.totalRec[i].lastModifiedDateTime, name : this.totalRec[i].name, size : this.totalRec[i].size,webUrl:this.totalRec[i].webUrl,downloadURL : this.totalRec[i].downloadURL });
              }
            }
            this.totalRec = allrecs;
          }   
          this.recordToDisplay = deletePush.map(item=>{
            return {...item,            
                "iconName":showIcons({itemName:item.name,itemURL :item.downloadURL})
            }
          });
          this.showLoadingSpinner = false;
          this.recordList = this.totalRec;                    
        }
        this.searchBar = this.totalRec;
        this.recordList = this.totalRec;
        this.template.querySelector("c-search").handleSearchValueChange();
        refreshApex(this.recordToDisplay);
        this.setRecordsToDisplay();
      }).catch(error=>{
          this.dispatchEvent(new ShowToastEvent({title: 'Error!!',message: 'Error occured in deletion!.'+error,variant: 'error'}),);
        });
  }   

  // method is called onclick of breadcrumbs
  handleNavigateTo(event){
    const name = event.target.name;
    this.selectedFolder      = name;
    this.showDataTableSpinner=true;
    try{
      getAllFiles({ selectedFolderId : name})
      .then(result=>{
        this.recordList = result;
        this.searchBar = result;
        this.setRecordsToDisplay();
        this.totalRec = result; 
        refreshApex(this.recordToDisplay);
        const index = this.myBreadcrumbs.findIndex((element, index) => {
          if(element.name === name){
            return true;
          }
        })
        this.myBreadcrumbs.splice(index+1,this.myBreadcrumbs.length-1);   
        this.showDataTableSpinner = false;
      })  
    }catch(e){
      console.error(e);
    }
    event.preventDefault();
  }

  //method is called when any row action is performed
  handleRowAction(event){   
    let actionName = event.detail.action.name;  
    let row = event.detail.row;    
    let tempName;
    let ext;
    this.selectedFolder=row.Id;
    if(actionName == undefined){
      var obj = { label: row.name, name: row.Id, id: row.Id};
      tempName = row.name.split('.');
      ext = tempName[(tempName.length-1)];
      if(ext != 'txt' && ext != 'ppt' && ext !='docx' && ext != 'csv' && ext!= 'pptx' && ext!= 'exe' && ext != 'zip' && ext!= 'esp' && ext != 'xlsx' && ext != 'xls' && ext != 'tif' && ext != 'tiff' && ext != 'png' && ext != 'jpeg' && ext != 'jpg' && ext != 'gif' && ext != 'html' && ext != 'pdf'){
        this.myBreadcrumbs.push(obj);
      }
      this.showDataTableSpinner = true;
    }  
    if(row != null && ext != 'txt' && ext != 'ppt' && ext != 'docx' && ext != 'csv' && ext!= 'pptx' && ext!= 'exe' && ext != 'zip' && ext!= 'esp' && ext != 'xlsx' && ext != 'xls' && ext != 'tif' && ext != 'tiff' && ext != 'png' && ext != 'jpeg' && ext != 'jpg' && ext != 'gif' && ext != 'html' && ext != 'pdf'){
        getAllFiles({ 
          selectedFolderId : row.Id
        }).then(result=>{
            if(actionName != undefined){
              switch(actionName){         
                case 'open_sp':
                  refreshApex(this.recordToDisplay)
                  window.open(row.webUrl);
                  break;
                case 'edit':
                  this.reNameModel = true;
                  this.renamedvalue = row.name;
                  this.renamefolderId=row.Id;
                  break;
                case 'download': 
                  if(row.downloadURL != null) {
                    window.open(row.downloadURL);
                  }else{
                    this.dispatchEvent(new ShowToastEvent({title: 'Info!',message: 'Folders cannot be downloaded',variant: 'info'}),);
                  }
                  break;
                case 'delete':
                  this.deleteModel = true;
                  this.deletefolderId =row.Id;
                  this.deleteFoldername = row.name;
                  break;
              }
            }else{
              if(this.recordList != ''){
                this.recordList = '';
                this.recordList = result;
                this.searchBar = this.recordList;
                this.recordToDisplay.push(result);
                this.totalRec = result; 
                this.setRecordsToDisplay();
                refreshApex(this.recordToDisplay);
              }
            }
            this.showDataTableSpinner = false;
          }).catch(error=>{
              console.log('There is an error in HandleRowAction method');
            });
    }else{
      this.showDataTableSpinner = false;
    }
  }

  //Open Pop-up selected Model 
  handleSelect(event){
    const selected = event.detail.name;
    this.selectedItem = selected; 
    if(selected == 'upload'){
      this.uploadFileModal = true;
    }else { 
      this.uploadFileModal = false;
    }
    if(selected == 'isNewfolder'){
      this.closedModel = true;
    }else{
      this.closedModel = false;
    }  
  }

  // to close modal set isModalOpen tarck value as false
  closeModal() {
    this.uploadFileModal = false;
    this.closedModel = false;
    this.reNameModel = false;
    this.deleteModel = false;
  }

  //setup Button New Folder Main Records 
  handleClick() {
    setupNewFolder({ recordId: this.recordId,  objectApiName: this.objectApiName})
    .then(result=>{    
        window.location.reload();
    })
    .catch(error => {
        console.log('-------------------ERROR-------------'+error);
    });
  }

  // for Opening sharepoint site
  openInSharePoint(){
    if(this.docPathURL != null){
      window.open(this.docPathURL);
    }
  }

}
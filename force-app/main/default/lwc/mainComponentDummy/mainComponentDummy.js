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
            //horizontalAlign:'start'
        },
        hideDefaultActions: true
    },
    {label:'Created',fieldName:'createdDateTime',type:'text',hideDefaultActions: true,initialWidth:105},
    {label:'Last Modified',fieldName:'lastModifiedDateTime',type:'text',hideDefaultActions: true,initialWidth:105},
    {label:'Size',fieldName:'size',type:'number',hideDefaultActions: true,initialWidth:80,cellAttributes:{alignment:'left'}},
    {label:'Actions',fieldName:'Action',hideDefaultActions: true,type: 'action',
        typeAttributes: {
            rowActions: actions,
            menuAlignment: 'auto',
        }
    } 
];

const DELAY = 300;
let FolderName = [];

export default class MainComponent extends LightningElement {
    
    @track hasRendered = true;
    @track rename_value; 
    @track deleteFoldername;
    @track renamefolderId;
    myBreadcrumbs = [];
    @track myBreadcrumb = this.myBreadcrumbs;
    @track deletefolderId;
    @api recordId;
    @track foldername = FolderName;
    @track showLoadingSpinner = false;
    @track showLoadingSpinner1 = false;
    @track sharePointFolderId;
    @track sharePointId;               
    @track selectedFolder;
    @track renamedvalue; 
    @track subFolder;                
    @track showSetup=false;
    @track showPagination = false;
    @track name;
    @track error;
    @track value;
    @api objectApiName;
    @track recId; 
    @track currentObjectName;
    @track columns = columns;
    @track fileName = '';
    @track UploadFile = 'Upload File';
    // @track showLoadingSpinner = false;
    @track isTrue = false;
    @track selectedItem;
    @api horizontalAlign = 'end';
    @track uploadSmallFile = false;
    @track uploadLargeFile = false;
    @track selectedFolder;
    @api docPathURL;
    @api recordList;
    @track searchBar = [];
    @track searchResults = [];
    closedModel = false;
    @track wiredActivities;
    @api records;
    @track imageUrl;
    @track totalRec=[];
    records = '';
    data = [];
    NewFolderName;
    ASC_logo = ASCLogo;
    @track  custom_logo;
    reNameModel = false; 
    deleteModel = false;
    totalPage;
    totalRecords;
    pageNo;
    @track norecordsToDisplay = false;
    @api recordsperpage = 5; //no. of records to be displayed in a single page
    @track recordToDisplay;
    @track searchString;
    startRecord;
    endRecord;
    //@track newRecord;
    end = false;

    // Connected Call Back Method Used : recordId, objectApiName
    connectedCallback() {
      checkSharePointFolderId({currentPageId: this.recordId, objectApiName: this.objectApiName})
          .then(result=>{
              this.showSetup = result[0].folderSetup;
              this.foldername = result[0].recordName;
              this.sharePointFolderId = result[0].sharePointFolderId;
              if(result[0].customLogo != null){
                this.custom_logo         = result[0].customLogo;
                this.imageUrl = '/sfc/servlet.shepherd/version/download/'  + this.custom_logo;
              }else{
               // this.imageUrl = ASCLogo;
                this.ASC_logo = ASCLogo;
              }
          }).catch(error => {
              // Showing errors if any while uploading folder.
              console.log('-------------------ERROR-------------'+error);
          });  
    }
    //Calling the getAllFolder method from the apex class. WiredRecords method use to handle data and error.
    @wire(getAllFolder,{recordId:'$recordId',objectApiName :'$objectApiName'})
    wiredRecords(value){  
      this.wiredActivities  = value;
      const { data, error } = value;
      if(data){
        this.recordList          = JSON.parse(JSON.stringify(data));
        this.foldername          = data[0].recordName;
        this.sharePointFolderId  = data[0].sharePointFolderId;
        this.selectedFolder      = this.sharePointFolderId;
        this.searchBar           = this.recordList;
        this.docPathURL          = data[0].docPath; 
        this.custom_logo         = data[0].customLogo;
        this.totalRec            = data;
        if(data[0].customLogo != null){
        this.imageUrl = '/sfc/servlet.shepherd/version/download/'  + this.custom_logo;
        }else{
          this.imageUrl = ASCLogo;
        }
        this.records = this.recordList.length; //it will calculate the number of records present
        var obj = { 
          label: this.foldername,
          name:  this.sharePointFolderId, 
          id:    this.sharePointFolderId
        };
        if(this.myBreadcrumb == ''){  
            this.myBreadcrumbs.push(obj);
        }
        if(data[0].name != undefined){
          this.recordToDisplay = this.recordList;
          // if(data[0].customLogo != null){
            this.imageUrl = ASCLogo;
         // }// }else{
          //   this.imageUrl = ASCLogo;
          // }
          this.setRecordsToDisplay();
        }
        if(data[0].name == undefined ){
          this.norecordsToDisplay = true;
          this.imageUrl = '/sfc/servlet.shepherd/version/download/'  + this.custom_logo;

           
           // this.ASC_logo = ASCLogo
          
        }else if(error){
          this.error = error;
        }
      }
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
    
    setRecordsToDisplay(){
      this.pageNo = 1;
        this.totalRecords = this.recordList.length;
          if(this.totalRecords > 5 ){
            this.showPagination = true;
            this.norecordsToDisplay = false;
            this.totalPage = Math.ceil(this.totalRecords/this.recordsperpage);
            this.preparePaginationList();
          }else if(this.totalRecords == 0){
            this.norecordsToDisplay = true;
            this.showPagination = false;
            this.totalPage = 0;
            this.pageNo = 0;
            this.recordToDisplay = [];
          }else if(this.totalRecords>0 && this.totalRecords<=5){
            this.norecordsToDisplay = false;
            this.showPagination = false;
            this.totalPage = 1;
            //this.disacbleEnableActions();
            let begin = (this.pageNo - 1) * parseInt(this.totalRecords);
            let end = parseInt(begin) + parseInt(this.totalRecords);
            this.recordToDisplay = this.recordList.slice(begin,end).map(item=>{
              var ValueSet = {itemName:item.name,itemURL :item.downloadURL}
              var names = this.showIcons(ValueSet);
              return {...item,            
                "iconName":names
              }
            });
          }
    }

    preparePaginationList(){
        let begin = (this.pageNo - 1) * parseInt(this.recordsperpage);
        let end = parseInt(begin) + parseInt(this.recordsperpage);
        this.recordToDisplay = this.recordList.slice(begin,end).map(item=>{
              var ValueSet = {itemName:item.name,itemURL :item.downloadURL}
              var names = this.showIcons(ValueSet);
              return {...item,            
                "iconName":names
              }
        });
        this.searchBar = this.recordList;
        this.startRecord = begin +1;
        this.endRecord = end > this.totalRecords ? this.totalRecords : end;
        this.end = end > this.totalRecords ? true : false;
        window.clearTimeout(this.delayTimeout);
        this.delayTimeout = setTimeout(()=>{
          this.disacbleEnableActions();
        },DELAY);
        
      }

      handleClosedModelValue(event){
        //this.newRecord= event.detail.newFolderRecord;
        if(this.recordList.length == 1 && this.recordList[0].folderSetup == true){
          //this.recordList = [...this.newRecord];
          this.recordList = [...event.detail.newFolderRecord];
        }else{
          this.recordList = [...event.detail.newFolderRecord,...this.recordList];
          //this.recordList = [...event.detail.newFolderRecord, ...this.recordList];
        }
        this.totalRec = this.recordList;
        this.searchBar= event.detail.newFolderRecord;
        this.records= this.recordList.length;
        refreshApex(this.recordToDisplay);
        this.setRecordsToDisplay();
        this.closedModel= event.detail.modal;
      }

      handleUploadFileCloseModalValue(event){
        this.uploadSmallFile = event.detail;
      }
      handleFolderCloseModalValue(event){
        this.closedModel = event.detail;
      }

      handleUploadFileResponseValue(event){
        //this.newRecord= event.detail;
        if(this.recordList.length == 1 && this.recordList[0].folderSetup == true){
          this.recordList = [...event.detail];
        }else{
          // this.recordList = [...event.detail,...this.recordList];
          this.recordList = [...this.recordList,...event.detail];
        } 
        this.searchBar= event.detail;
        this.records= this.recordList.length;
        this.recordToDisplay= this.recordList;
        this.setRecordsToDisplay();
        refreshApex( this.recordToDisplay);
      }

    hanldeProgressValueChange(event){
        this.searchResults = event.detail.searchResult;
        this.searchString = event.detail.searchString;
        if(this.searchResults != '' && this.searchResults != 1 ){ 
          this.recordList = this.searchResults;
          this.records = this.searchResults.length;
        }
        else if(this.searchResults == ''){
          this.recordList = this.totalRec;
          this.records = this.totalRec.length;
        }
        else if(this.searchResults.valueOf() == 1){
          this.recordList = [];
          this.records = 0;
        }
        this.setRecordsToDisplay();
        return refreshApex(this.recordToDisplay);
    }

    disacbleEnableActions(){
        let buttons = this.template.querySelectorAll('lightning-button');
        buttons.forEach(bun =>{
          if(bun.label === 'Previous'){
            bun.disabled = this.pageNo === 1 ? true:false;
          }
          else if(bun.label === 'Next'){
            bun.disabled = this.pageNo === this.totalPage ? true : false;
          }
        })
      }

      handleNext(){
        this.pageNo +=1;
        this.preparePaginationList();
      }
    
      handlePrevious(){
        this.pageNo -=1;
        this.preparePaginationList();
      }

      handleClickButtons(event){
        let label = event.target.label;
        if(label === 'Previous'){
          this.handlePrevious();
        }
    
        else if(label === 'Next'){
          this.handleNext();
        }
      }
    
      handlePage(button){
        this.pageNo = button.target.label;
        this.preparePaginationList();
      }

    //onclick method to call when Get Folder Name for  Nem folder/Rename folder
    handleTextChange(event){
        this.NewFolderName = event.target.value;
    }

    //onclick method to call when Rename Folder Name for Rename folder
    rename_method(event){  
      this.showLoadingSpinner = true;     
        if(this.NewFolderName != "null"){
            renameFolder({ 
                rename_value: this.NewFolderName,
                renameId : this.renamefolderId
                }).then(result=>{   
                    this.reNameModel = false;
                   var records = this.recordToDisplay;
                    var recordsPush = [];
                    var i;
                    var today = new Date();
                    var dd = String(today.getDate()).padStart(2, '0');
                    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
                    var yyyy = today.getFullYear();
                    today = dd + '-' + mm + '-' + yyyy;
                    if(result != ''){
                      for(i = 0 ; i < records.length; i++ ){ 
                        if(records[i].Id == result.Id){
                          recordsPush.push({createdDateTime : result.createdDateTime, Id :result.Id , lastModifiedDateTime : today, name : this.NewFolderName, size : result.size,webUrl : result.webUrl, downloadURL : result.downloadURL });
                        }else{
                          recordsPush.push({createdDateTime : records[i].createdDateTime, Id :records[i].Id , lastModifiedDateTime :records[i].lastModifiedDateTime, name : records[i].name, size : records[i].size,webUrl : records[i].webUrl,downloadURL : records[i].downloadURL });
                        }
                      }
                      var renameDisplay = [];
                      for(i = 0 ; i < this.totalRec.length; i++ ){ 
                        if(this.totalRec[i].Id == result.Id){
                          renameDisplay.push({createdDateTime : this.totalRec[i].createdDateTime, Id :this.totalRec.Id , lastModifiedDateTime : today, name : this.NewFolderName, size : this.totalRec[i].size,webUrl : this.totalRec.webUrl,downloadURL : this.totalRec.downloadURL });
                        }else{
                            renameDisplay.push({createdDateTime : this.totalRec[i].createdDateTime, Id :this.totalRec[i].Id , lastModifiedDateTime :this.totalRec[i].lastModifiedDateTime, name : this.totalRec[i].name, size : this.totalRec[i].size,webUrl : this.totalRec[i].webUrl, downloadURL : this.totalRec[i].downloadURL });
                          }
                        }
                      this.totalRec = renameDisplay;
                      this.recordToDisplay = recordsPush.map(item=>{
                        console.log('item ===='+item);
              console.log('item stringifyy ===='+JSON.stringify(item));
              console.log('item ===='+item.name);
              var ValueSet = {itemName:item.name,itemURL :item.downloadURL}
              var names = this.showIcons(ValueSet);
              console.log('download URL 240-----'+item.downloadURL);
              return {...item,            
                "iconName":names
              }
                      });
                     this.searchBar = this.totalRec;
                     refreshApex(this.recordToDisplay);   
                    }
                    this.dispatchEvent(new ShowToastEvent({
                      title: 'Success!!',
                      message: ' Renamed to ' +this.NewFolderName +' successfully!.',
                      variant: 'success'        
                  }),);
                  this.showLoadingSpinner = false; 
                }).catch(error=>{         
                        this.dispatchEvent(new ShowToastEvent({
                        title: 'Error!!',
                        message: 'Error occured in renaming!.',
                        variant: 'error'
                  }),);
            });
        }
    }

    //onclick method to call when Delete Folder or File
    delete_method(event){ 
        this.showLoadingSpinner = true;
        deleteFolder({                       
            deletefolderId : this.deletefolderId
            }).then(result=>{
                    this.deleteModel = false;
                    if(result == null){
                        this.dispatchEvent(new ShowToastEvent({
                        title: 'Success!!',
                        message: this.deleteFoldername+' is deleted successfully!.',
                        variant: 'success'
                    }),);
                    var i;
                    var deletePush=[];
                    var allrecs = [];
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
                      console.log('item ===='+item);
                      console.log('item stringifyy ===='+JSON.stringify(item));
                      console.log('item ===='+item.name);
                      var ValueSet = {itemName:item.name,itemURL :item.downloadURL}
                      var names = this.showIcons(ValueSet);
                      console.log('download URL 240-----'+item.downloadURL);
                      return {...item,            
                        "iconName":names
                      }
                    });
                    this.showLoadingSpinner = false;
                    this.recordList = this.totalRec;                    
                  }
                    this.searchBar = this.totalRec;
                    this.recordList = this.totalRec;
                    if(this.searchString != ''){
                      this.template.querySelector("c-search").handleSearchValueChange();
                    }
                    refreshApex(this.recordToDisplay);
                    this.records = this.recordList.length;
                    this.setRecordsToDisplay();
                
                }).catch(error=>{
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Error!!',
                    message: 'Error occured in deletion!.'+error,
                    variant: 'error'
                }),);
        });
    }   
    
    // method is called onclick of breadcrumbs
    handleNavigateTo(event) {
        const name = event.target.name;
        const label = event.target.label;
        this.selectedFolder      = name;
        this.showLoadingSpinner1=true;
        try{
            getAllFiles({ selectedFolderId : name}).then(result=>{
                this.recordList = result;
                this.searchBar = result;
                this.records = result.length;
                  
                this.setRecordsToDisplay();
                this.totalRec = result; 
                
                refreshApex(this.recordToDisplay);
                const index = this.myBreadcrumbs.findIndex((element, index) => {
                    if (element.name === name) {
                      
                        return true;
                        
                    }
                    
                })
                this.myBreadcrumbs.splice(index+1,this.myBreadcrumbs.length-1);   
                this.showLoadingSpinner1=false;
                // refreshApex(this.recordToDisplay);
                // this.showLoadingSpinner=false;
            })  
            
        }catch(e){
        console.error(e);
    }
    
     event.preventDefault();
    
    }

    //method is called when any row action is performed
    handleRowAction(event){   
        alert('hi');
        let actionName = event.detail.action.name;  
        let row = event.detail.row;    
        var FirstName = row.name;
        
        var tempName;
        var ext;
        this.selectedFolder=row.Id;
        //this.renderedCallbackMethod();         
        if(actionName == undefined){
            var obj = { 
            label: row.name,
            name: row.Id, 
            id: row.Id
          };
          tempName = row.name.split('.');
          ext = tempName[(tempName.length-1)];
          if(ext != 'txt' && ext != 'ppt' && ext !='docx' &&ext != 'csv' && ext!= 'pptx' && ext!= 'exe' && ext != 'zip' && ext!= 'esp' && ext != 'xlsx' && ext != 'xls' && ext != 'tif' && ext != 'tiff' && ext != 'png' && ext != 'jpeg' && ext != 'jpg' && ext != 'gif' && ext != 'html'){
            this.myBreadcrumbs.push(obj);
            
          }
            this.showLoadingSpinner1 = true;
        }  
        if(row != null && ext != 'txt' && ext != 'ppt' && ext != 'docx' && ext != 'csv' && ext!= 'pptx' && ext!= 'exe' && ext != 'zip' && ext!= 'esp' && ext != 'xlsx' && ext != 'xls' && ext != 'tif' && ext != 'tiff' && ext != 'png' && ext != 'jpeg' && ext != 'jpg' && ext != 'gif' && ext != 'html'){
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
                            }
                            else{
                              this.dispatchEvent(new ShowToastEvent({
                                title: 'Info!',
                                message: 'Folders cannot be downloaded',
                                variant: 'info'
                              }),);
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
                    this.records = result.length;
                    this.recordToDisplay.push(result);
                    this.totalRec = result; 
                    this.setRecordsToDisplay();
                    refreshApex(this.recordToDisplay);
                  }
                }

                // if(this.reNameModel != true && this.deleteModel != true){
                  this.showLoadingSpinner1 = false;
                // }
              
            }).catch(error=>{
                console.log('There is an error in HandleRowAction method');
            });
        }
      }
    //  Open Pop-up selected Model 
    handleSelect(event){
        const selected = event.detail.name;
        this.selectedItem = selected;
        if(selected == 'upload'){
          this.uploadSmallFile = true;
        }else 
        { 
          this.uploadSmallFile = false;
        }
        if(selected == 'isNewfolder'){
          this.closedModel = true;
        }else{
          this.closedModel = false;
        }
    }

    closeModal() {
        // to close modal set isModalOpen tarck value as false
        this.uploadSmallFile = false;
        this.closedModel = false;
        this.reNameModel = false;
        this.deleteModel = false;
    }

     // setup Button New Folder Main Records 
    handleClick() {
        this.recId = this.recordId;
        this.currentObjectName = this.objectApiName;
        setupNewFolder({ recordId: this.recId,  objectApiName: this.objectApiName})
        .then(result=>{    
            window.location.reload();
        })
        .catch(error => {
            console.log('-------------------ERROR-------------'+error);
        });
    }

    openInSharePoint(){
        if(this.docPathURL != null){
            window.open(this.docPathURL);
        }
    
    }
}
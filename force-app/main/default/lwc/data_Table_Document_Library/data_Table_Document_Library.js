import { LightningElement,wire,track,api } from 'lwc';
import getAllFolder from '@salesforce/apex/ServicesCalloutToSharePoint.getAllFolder'; /*importing the getAllFolder method from ServicesCalloutToSharePoint
                                                                for getting all the folders in the drive*/
import getAllFiles from '@salesforce/apex/ServicesCalloutToSharePoint.getAllFiles';   /*importing the getAllFiles method to get all the files
                                                                                    associated with the folder chosen */
import renameFolder from '@salesforce/apex/ServicesCalloutToSharePoint.renameFolder';

import openInSharepoint from'@salesforce/apex/ServicesCalloutToSharePoint.openInSharepoint';


// specify the actions that are required in the dropdown menu of the data table
const actions = [
    {label: 'Open in SharePoint', name: 'open_sp'},
    { label: 'Rename', name: 'edit'},
    { label: 'Download', name: 'download'},
    { label: 'Delete', name: 'delete'}
];

//specify the columns that are required in the data table with the associated properties or attributes
const columns=[
    {label:'Name',fieldName:'name',type:'button',
        typeAttributes:{label:{fieldName:'name'},variant:'base'},sortable:true},
    {label:'Created',fieldName:'createdDateTime',type:'text'},
    {label:'Last Modified',fieldName:'lastModifiedDateTime',type:'text'},
    {label:'Size',fieldName:'size',type:'number'},
    {type: 'action',
    typeAttributes: {
        rowActions: actions,
        menuAlignment: 'right'
    }
    }
];
export default class Data_Table_Document_Library extends LightningElement {
@track renamedvalue; //rename_value is used for renaming the folder/file name in the modal
error;               //variable for storing the eroors if any
columns=columns;
wiredActivities;
records='';
data=[];            //for storing the data that is coming from server
@track totalPage = 0;
@track pageSize = 5;
@track renamefolderId;
@api recordId;
@track downoadUrl;
//recId=this.recordId;

downloadFile(id) {
     window.open(id);
}
ready = false; /* A boolean value specifying whether or not the modal should open 
                ready = false modal as hidden
                ready = true  modal visible*/

showModal(){         //Call this method when you want to make the modal visible
    this.ready=true;
}
closeModal(){        //Call this method when you want to make the modal hidden
    this.ready=false;
}

rename_method(event){
    alert('working');
      var inp=this.template.querySelector("lightning-input");
      this.renamedvalue=inp.value;   //get the value of the element that triggered the event
      console.log("new value= "+this.renamedvalue);
      console.log("inp value= "+inp.value);
      
      if(inp.value!="null"){
        console.log("tested");
        renameFolder({                       //calling the function from the apex controller and sending the parameters
            rename_value: inp.value,
            renameId : this.renamefolderId
      }).then(result=>{
        console.log("renamed folder");
        this.ready=false;
        
      }).catch(error=>{
        console.log("error");
      });
      }
}
// @wire(getAllFolder) Folder_List;

//Calling the getAllFolder method from the apex class
@wire(getAllFolder,{currentPageid:'$recordId'})
wiredCases(value){  //wiredCases is a function for handling the data and errors properly..
this.wiredActivities = value;
const { data, error } = value;
if(data){
    //alert(data);
    let dataEditing = JSON.parse(JSON.stringify(data));
    this.data = dataEditing;
    //alert("dataediting="+dataEditing);
    this.records = dataEditing.length; //it will calculate the number of records present
    //alert(this.records);
    this.totalPage = Math.ceil(this.records/this.pageSize);
    //alert("Total Pages Required=="+this.totalPage);
    this.data = dataEditing;          
    //alert(this.data);
}else if(error){
    this.error = error;
}

}
handleRowAction(event){               //this method will be called whenever there will be any row action performed on the data table
    let actionName = event.detail.action.name;  // it will give the action name
    let row = event.detail.row;  
    
    //alert(actionName);
    //alert('Name='+row.name);
    if(row!="null"){
        console.log("tested");
        getAllFiles({                       //calling the function from the apex controller and sending the parameters
            //selectedName: JSON.stringify(row.name)
            selectedFolderId : row.Id,
        }).then(result=>{
        console.log('working');
        console.log(result);
        if(actionName!=undefined){
            switch(actionName){         //switch case will work according to the action recieved in actionName variable
                case 'open_in_sp':
                    //alert(actionName);
                    openInSharepoint({                       //subFolderId:this.parentfolderidcalling the function from the apex controller and sending the parameters
                        openfolderId: row.Id,
                    }).then(result=>{
                      console.log("done");
                     
                      
                    }).catch(error=>{
                      console.log("error");
                    });
                    break;
                case 'edit':
                    //alert(actionName);
                    this.ready = true;
                    this.renamedvalue = row.name;
                    this.renamefolderId=row.Id;
                    //this.editCurrentRecord(row);
                    break;
                case 'download':
                    alert(actionName);
                    this.downloadFile(row.downloadURL);
                    // this.editCurrentRecord(row);
                    break;
                case 'delete':
                    alert(actionName);
                    
                    // this.editCurrentRecord(row);
                    break;
                }
        }else{
            this.data=result;
        }
        //alert(JSON.stringify(this.FolderTest));
        // console.log("this.Folder_List============"+this.data); //the list was getting empty with this
        
        }).catch(error=>{
            console.log('error');
        });
    }


    }

}

/* @wire(getAllFolder,{
}
)
wiredCases(value){
this.wiredActivities = value;
const { data, error } = value;

if(data){
alert(data);
let dataEditing = JSON.parse(JSON.stringify(data));
alert("dataediting="+dataEditing);
this.records = dataEditing.length;
alert(this.records);
this.data = dataEditing;
alert(this.data);

}else if(error){
this.error = error;
}

}

showValues=false;
showData(){
this.showValues=true;
/*getAllDrives().then(results=>{
    console.log('function called');
}).catch(error=>{
    console.log('error in the code');
});
}



/*data=[];
coulmns=columns;*/
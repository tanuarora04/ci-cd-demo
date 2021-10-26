import { LightningElement,api } from 'lwc';
import getCustomMetadataValues from '@salesforce/apex/CreateContainers.getCustomMetadataValues';

export default class Pagination extends LightningElement {
    totalRecords;    //Contains all the records
    visibleRecords;  //Contains sliced records to be sent
    pageSize;        //No. of records to be displayyed per page
    pageNo = 1;      //The starting page
    totalPage = 0;   //Total Pages
    noRecordsToDisplay;

    /* Method called on the load of the page to get the value of Page size from metadata*/ 
    connectedCallback(){
        getCustomMetadataValues().then(result=>{
            if(result != null){
                this.pageSize = (JSON.stringify(result.ASCSFSP__Page_Size__c) != null && JSON.stringify(result.ASCSFSP__Page_Size__c) != '0')  ? JSON.stringify(result.ASCSFSP__Page_Size__c) : 5;
            }
        }).catch(error=>{
            console.error(error);
        })
    }

    /*Getter and Setter methods to modify the records recieved from parent component */
    get records(){
        return this.visibleRecords;
    }

    @api 
    set records(data){
        if(data){
            this.totalRecords = data;
            this.totalPage = Math.ceil(data.length/this.pageSize);
            this.updateRecords();
            this.noRecordsToDisplay = this.totalRecords.length > Number(this.pageSize) ? true : false;
        }
    }

    /* Getter method that returns true or false to disable Previous Button */
    get disablePreviousBtn(){
        return this.pageNo <=1;
    }

    /* Getter method that returns true or false to disable Next Button */
    get disableNextBtn(){
        return this.pageNo >= this.totalPage;
    }

    /* To send the updated records after modification to the parent component */
    updateRecords(){
        const start = (this.pageNo - 1)*this.pageSize;
        const end = this.pageSize*this.pageNo;
        this.visibleRecords = this.totalRecords.slice(start,end)
        this.dispatchEvent(new CustomEvent('update',{detail:{records:this.visibleRecords}}))
    }

    /* Method called on click of Previous Button */
    previousHandler(){
        if(this.pageNo > 1){
            this.pageNo -= 1;
            this.updateRecords();            
        }
    }

    /* Method called on click of Next Button */
    nextHandler(){
        if(this.pageNo < this.totalPage){
            this.pageNo += 1;
            this.updateRecords();
        }
    } 
}
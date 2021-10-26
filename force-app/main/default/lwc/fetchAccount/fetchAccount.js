import getAccounts from '@salesforce/apex/FetchAccounts.getAccounts';
import delAccount from '@salesforce/apex/FetchAccounts.delAccount';
import renameAccount from '@salesforce/apex/FetchAccounts.renameAccount';
import { LightningElement,wire,track } from 'lwc';
import {refreshApex} from '@salesforce/apex';

const actions = [
        { label: 'Rename', name: 'edit' },
        { label: 'Delete', name: 'delete' },
    ];
const columns = [
        { label: 'Name', fieldName: 'Name' },
        { label: 'Account Number', fieldName: 'AccountNumber'},
        { label: 'Country', fieldName: 'Country__c'},
        { type: 'action', typeAttributes: { rowActions: actions, menuAlignment: 'auto' }},
    ];
export default class FetchAccount extends LightningElement {
        @track recordToDisplay;
        @track deletedAccountId;
        @track reNameModel = false;
        @track renamedvalue;
        @track renameAccId;
        @track fileExtension;
        @track ext;
        columns = columns;


        @wire(getAccounts) 
        accounts({data,error}){
                if(data){
                        this.recordToDisplay = data;
                }
                else{
                        this.error = error;
                }
        }

        getAccountRenamed(){
                renameAccount({accName:this.template.querySelector('.fetchName').value ,accId :this.renameAccId })
                .then(result=>{
                        this.reNameModel = false;
                        let records = JSON.parse(JSON.stringify(this.recordToDisplay));
                        //let records = this.recordToDisplay;
                        records.filter(item=>{
                                if(item.Name === this.renamedvalue){
                                        item.Name = this.template.querySelector('.fetchName').value;
                                }
                        });
                        this.recordToDisplay = records;
                        return refreshApex(this.recordToDisplay);
                })
        }

        deleteAccount(){
                delAccount({deleteId:this.deletedAccountId})
                .then(result=>{
                        if(result == null){
                                let delRow = this.recordToDisplay;
                                delRow = delRow.filter(currentItem=>{
                                        return currentItem.Id !== this.deletedAccountId;
                                });
                                this.recordToDisplay = delRow;
                                refreshApex(this.recordToDisplay);
                        }      
                })
        }

        handleRowAction(event){
                const action = event.detail.action;
                const row = event.detail.row;
                let tempName;
                let finalName;
                console.log(row.Name);
                if(row.Name.includes('.')){
                        tempName = row.Name.split('.');
                        finalName = tempName[0];
                        this.ext = '.'+tempName[(tempName.length-1)];
                }else{
                        finalName = row.Name;
                        this.ext = '';
                }
                switch (action.name){
                        case 'edit' : 
                                this.reNameModel = true;
                                this.renamedvalue = finalName;
                                this.fileExtension = this.ext;
                                this.renameAccId = row.Id;
                                break;
                        case 'delete' :
                                this.deletedAccountId = row.Id;
                                this.deleteAccount();
                                break;
                }

        }
}
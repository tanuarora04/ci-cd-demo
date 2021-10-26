import { LightningElement,api,track } from 'lwc';
import checkAccessToken from '@salesforce/apex/CreateContainers.checkAccessToken'; //to create containers in a particular storage account.
import getDynamicQuery from '@salesforce/apex/CreateContainers.getDynamicQuery'; //to get the container name value from the current record according to the values in the custom metadata.
import checkContainerName from '@salesforce/apex/CreateContainers.checkContainerName';
import ASCLogo from '@salesforce/resourceUrl/ASCLogo';   //import the default App logo from the static resources.
import {ShowToastEvent} from 'lightning/platformShowToastEvent'; // to display success and error messages.

export default class Containers extends LightningElement {
    @api recordId;
    @api objectApiName;
    @track showPopUp = false;
    @track showLoadingSpinner = false;
    @track showError = false;
    @track newValue;
    @track ASC_logo;
    @track showSetup = true;
    nullValue;

    connectedCallback(){
        checkContainerName({recordId:this.recordId,objectApiName:this.objectApiName})
        .then(result=>{
            this.showSetup = result[0].setup;
            this.ASC_logo = (result[0].customLogo != null) ? result[0].customLogo : ASCLogo;
        }).catch(error=>{
            console.log('error'+error);
        })
    }
    
    /* create the containers for each record. */
    containerCreation(){
        if(this.showError && (this.newValue != null && this.newValue != undefined)){
            this.showLoadingSpinner = true;
            checkAccessToken({recordId:this.recordId,objectApiName:this.objectApiName,rootContainerName:this.newValue})
            .then(result=>{
                if(result !=null && result !='409'){
                    window.location.reload();
                    this.dispatchEvent(new ShowToastEvent({title: 'Success!!',message: `Container "${this.newValue}" successfully created!` ,variant: 'success'}));
                }else if(result ==  '409'){
                    this.dispatchEvent(new ShowToastEvent({title: 'Error!!',message: 'Duplicate Container name found!',variant: 'error'}));
                    this.showPopUp = true;
                    this.containerName = this.newValue;
                }
                this.showLoadingSpinner = false;
            }).catch(error=>{
                console.log('error-->'+error);
            })
        }
    }
    /* handle the value change of the input field and checks the container name. */
    handleValueChange(event){
        this.newValue = event.target.value;
        let patt = new RegExp("^(?!-)(?!.*--)[a-z0-9-]+(?<!-)${3,63}");
        this.showError = patt.test(this.newValue);
    }
    /* Method to create a new container for each record */
    createRecordContainer(){
        getDynamicQuery({recordId:this.recordId,objectApiName:this.objectApiName,containerName:this.nullValue}).then(result=>{
            if(result != null){
                this.newValue = result[0].toLowerCase().replaceAll(' ','-'); //remove all spaces and convert letters to lower case
                this.newValue = this.newValue.replace(/[^a-z0-9\-]/g, '');  //replace special characters
                this.newValue = this.newValue.replace(/(^\-+|\-+$)/mg,'');  //start and end should not have hyphen (-)
                this.newValue = this.newValue.replace(/-{2,}/g, ''); //no consecutive hyphens (--) should be present
                this.showError = true;
                if(this.newValue !== null || this.newValue !== undefined && this.showError){
                    this.containerCreation();
                }
            }
        }).catch(error=>{
            console.log(error);
        })
    }
    /* closes the create container modal */
    closeModal(){
        this.showPopUp = false;
    }

}
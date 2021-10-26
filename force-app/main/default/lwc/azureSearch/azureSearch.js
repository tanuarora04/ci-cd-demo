import { LightningElement,api, track } from 'lwc';

export default class AzureSearch extends LightningElement {
  
    @api recordsToDisplay = [];
    @track searchString;

    handleSearch(event){
        console.log('Search record to display'+this.recordsToDisplay);
      this.searchString = event.target.value;

       
    }
}
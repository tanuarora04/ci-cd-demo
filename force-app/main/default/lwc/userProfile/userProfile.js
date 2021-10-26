// import { LightningElement, wire, track  } from 'lwc';
// import getAllUsers from '@salesforce/apex/UserProfile.getAllUsers';
// export default class UserProfile extends LightningElement {
//     @track values;
//     @track tempVAl = true;
//     handleChange(){
//         // alert('val==='+this.template.querySelector('input[type="checkbox"]:checked').checked);
//         // alert('val==='+this.template.querySelector('lightning-input').checked);
//         this.tempVAl = this.template.querySelector('lightning-input').checked;
//     }
//     @wire(getAllUsers,({activeStatus:'$tempVAl'}))
//     UserInfo({data,error}){
//         if(data){
//             this.values = data;
//         }
//         else{
//             this.error = error;
//         }
//     }
// }
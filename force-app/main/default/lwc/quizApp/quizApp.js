import { LightningElement } from 'lwc';

export default class QuizApp extends LightningElement {
    myQuestion = [
        {
        id:'Question1',
        question:'Which one of the following is not a template loop?',
        answers:{
            a:'for:each',
            b:'iterator',
            c:'map loop'
        },
        correctAnswer:'c'
    },
    {
        id:'Question2',
        question:'Which one of the file is invalid in LWC component folder?',
        answers:{
            a:'.svg',
            b:'.apex',
            c:'.js'
        },
        correctAnswer:'b'
    },
    {
        id:'Question3',
        question:'Which one of the following is not a directive?',
        answers:{
            a:'for:each',
            b:'if:true',
            c:'@track'
        },
        correctAnswer:'c'
    }
];
}
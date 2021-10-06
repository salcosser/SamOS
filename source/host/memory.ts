module TSOS{
    export class Memory{
        
        public memSet = [];
        constructor(){
        
        }
        
        public init(): void{
            this.memSet = new Array(MEM_LIMIT); //each unit of memory is given a single number as each memory address will not be responsible for more than ff, or 255
            for(let i = 0;i< MEM_LIMIT;i++){
                this.memSet[i] = 0;
            }
        }
    }
}
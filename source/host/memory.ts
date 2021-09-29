module TSOS{
    export class Memory{
        
        public memSet = [];
        constructor(){
        
        }
        
        public init(): void{
            this.memSet = new Array(MEM_LIMIT);
            for(let i = 0;i< MEM_LIMIT;i++){
                this.memSet[i] = "00";
            }
        }
    }
}
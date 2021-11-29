module TSOS{
    export class DSDD{

        public blankBlock = "40404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040";

            //findOpenSpace
            public findOpenSpace(): string{
                for(let l of _HardDisk.addrLabels){
                    if(_HardDisk.hardDiskSet.get(l) ==this.blankBlock){
                        return l;
                    }
                }
                return "X:X:X";
            }

            //writeData(start, data)
            // public writeData(data): boolean{
            //     let start = this.findOpenSpace();
            //     if(start === "X:X:X"){
            //         return false;
            //     }
            //     let blockSet = [];
            //     let tData = data;
            //     let lastPlace = "";
            //     while(tData.length > 0){
                    
            //         let tBlock = tData.substr(0,120);
            //         if(tData.length == data.length && tData.length > 128){

            //             tBlock = "01"+tBlock + DSDD.labelToString(start);
            //             let lablArr = labelToArr(start);
            //             _HardDisk.setBlock(lablArr[0], lablArr[1],labelArr[2], tBlock);
            //         }else if(tData.length > 120){
            //             let next = this.findOpenSpace();
            //             if(next === "X:X:X"){
            //                 return false;
            //             }
            //             tBlock = "01"+tBlock + DSDD.labelToString(next); // this logic isnt right
            //             let lablArr = labelToArr(next);
            //             _HardDisk.setBlock(lablArr[0], lablArr[1],labelArr[2], tBlock);
            //         }else{
            //             tBlock = "01"+tBlock + "XX:XX:XX";
            //         }

            //         tData = tData.substr(120);
            //         //blockSet[blockSet.length] = tBlock;
            //     }
            // }
            //readSpace(start)
            //clearSpace
            //format




            public static labelToString(label): string{
                let t =  "0" + label.substr(0,1);
                let s =  "0" + label.substr(2,1);
                let b =  "0" + label.substr(4,1);
                return (t+s+b);
            }
            public static stringToLabel(str): string{
                let t = parseInt(str.substr(0,2));
                let s = parseInt(str.substr(2,2));
                let b = parseInt(str.substr(4,4));
                return (t+":"+s+":"+b);
            }

            public static strToArr(str): string[]{
                let arr = [];
                arr[arr.length] = parseInt(str.substr(0,2));
                arr[arr.length] = parseInt(str.substr(2,2));
                arr[arr.length] = parseInt(str.substr(4,4));
                return arr;
            }
            public static labelToArr(label):string[]{
                let arr = [];
                arr[arr.length] = label.substr(0,1);
                arr[arr.length] = label.substr(2,1);
                arr[arr.length] = label.substr(4,1);
                return arr;
            }
    }
}
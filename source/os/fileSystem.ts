module TSOS{
    export class FileSystem{

        public  findFileDirRecord(fname:string): number[]{
            for(let s:number = 1;s<SECT_COUNT;s++){
                for(let b:number = 1;b<BLOCK_COUNT;b++){
                    
                    console.log(typeof s + "<s and b>" + typeof b);
                   console.log(_HardDisk.getBlock(0,s,b));
                    // _HardDisk.init();
                    console.log(typeof _HardDisk.getBlock );
                    console.log(_HardDisk.hardDiskSet.size);
                    // console.log("got past calling it");
                    if(_HardDisk.getBlock(0,s,b).substr(8) == fname){
                        
                        return [0,s,b];
                    }
                }
            }
            return [];
        
    }
    public setFileStart(fname, addrLbl): void{
        let dList = this.findFileDirRecord(fname);
        let uBlock = _HardDisk.getBlock(dList[0],dList[1], dList[2]);
        uBlock = DSDD.arrToString(dList) + "01"+ DSDD.strToHex(fname);
        _HardDisk.setBlock(dList[0],dList[1],dList[2],uBlock);
        
    }
     public initFile(fname): boolean{
        let location = [];
        for(let l of _HardDisk.dirRecs){
            if(_HardDisk.hardDiskSet.get(l) ==DSDD.blankBlock){
               location = DSDD.labelToArr(l);
               break;
            }
        }
        if(location != []){

            let nameInHex = DSDD.strToHex(fname);
            _HardDisk.setBlock(location[0], location[1], location[2], `99999901${nameInHex}`);
        }else{
            //throw interrupt
            return false;
        }
        return true;
     }   

     public writeToFile(fname,data): boolean{
         if(this.findFileDirRecord(fname)  == []){
             return false;
             //throw error
         }else{
            let fStart = _DSDD.writeData(data);
            if(fStart != []){
                this.setFileStart(fname, data);
                return true;
            }else{
                return false;
            }
         }
     }
    }
}
module TSOS{
    export class FileSystem{

    public  findFileDirRecord(fname:string): number[]{
            for(let s:number = 0;s<SECT_COUNT;s++){
                for(let b:number = 0;b<BLOCK_COUNT;b++){
                    if(s == 0 && b == 0){continue}
                   
                   // console.log(typeof _HardDisk.getBlock );
                   // console.log(_HardDisk.hardDiskSet.size);
                    // console.log("got past calling it");
                    if(_HardDisk.getBlock(0,s,b).substr(8) == DSDD.strToHex(fname)){
                        console.log("returned a real place");
                        return [0,s,b];
                    }
                }
            }
            return [-1,-1,-1];
        
    }
    public setFileStart(fname, addrLbl): void{
        let dList = this.findFileDirRecord(fname);
        let uBlock = _HardDisk.getBlock(dList[0],dList[1], dList[2]);
        uBlock = DSDD.arrToString(addrLbl) + "01"+ DSDD.strToHex(fname);
        _HardDisk.setBlock(dList[0],dList[1],dList[2],uBlock);
        console.log("set the start of the file to "+ dList.toString());
        
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
         }else if(data == "" || data == null){
            return true;
         }else{
            let fStart = _DSDD.writeData(data);
            if(fStart != []){
                console.log(fStart.toString()+ "<< first block of file data");
                this.setFileStart(fname, fStart);
                return true;
            }else{
                return false;
            }
         }
     }
    


    public readFromFile(fName): string{
        let fListing = this.findFileDirRecord(fName);
       // console.log("got to fs");
       // return "12345";
        console.log("yo im getting"+ fListing.toString());
        if(!FileSystem.validAddr(fListing)){
            return "--";
        }else{
            let cData = _DSDD.readBlock(fListing);
            let dataBuffer = "";
            console.log("Befff"+ cData);
            let cRData = cData.substr(8);
           // dataBuffer = dataBuffer + cRData;
            let nextPlace = this.getNextBlock(cData);
            if(nextPlace != []){
                console.log("got in here next");
                let hasNext = true;
                while(hasNext){
                    cData = _DSDD.readBlock(nextPlace);
                    if(!cData){
                        break;
                    }
                    cRData = cData.substr(8);
                    // console.log(cData);
                    dataBuffer = dataBuffer + cRData;
                    console.log("current buffer: "+FileSystem.hexToStr(dataBuffer))
                    nextPlace = this.getNextBlock(cData);
                    if(nextPlace == []){
                        hasNext = false;
                    }
                    
                }
            }
            return FileSystem.hexToStr(dataBuffer);
        }
    }

    public getNextBlock(blk):number[] {
        let nAddr = blk.substr(0,6);
        console.log("jumping to "+ nAddr);
        if(nAddr == "999999" || nAddr == "000000"){
            return [];
        }else{
            let t = parseInt(nAddr.substr(0,2),16);
            let s = parseInt(nAddr.substr(2,2),16);
            let b = parseInt(nAddr.substr(4,2),16);
            console.log("jumping to" + [t,s,b].toString());
            
            return  [t,s,b];
        }
    }
    public static validAddr(arr):boolean{
        return ((arr[0] + arr[1] + arr[2]) > -1);
    }
    public static hexToStr(hx):string{
        let hex  = hx.toString();
	    let str = '';
	    for (let n = 0; n < hex.length; n += 2) {
	    	str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
	    }
	    return str;
    }
}
}
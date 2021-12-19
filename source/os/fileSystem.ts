module TSOS{
    export class FileSystem{



    public swpCnt = 1;
    public swpMap = new Map();


    public  findFileDirRecord(fname:string): number[]{ // finding a file by filename
            for(let s:number = 0;s<SECT_COUNT;s++){
                for(let b:number = 0;b<BLOCK_COUNT;b++){
                    if(s == 0 && b == 0){continue}
                   
                   
                    if(_HardDisk.getBlock(0,s,b).substr(8) == DSDD.strToHex(fname)){
                        
                        return [0,s,b];
                    }
                }
            }
            return [-1,-1,-1];
        
    }
    public setFileStart(fname, addrLbl): void{ // setting the beginning of a file
        let dList = this.findFileDirRecord(fname);
        let uBlock = _HardDisk.getBlock(dList[0],dList[1], dList[2]);
        uBlock = DSDD.arrToString(addrLbl) + "01"+ DSDD.strToHex(fname);
        _HardDisk.setBlock(dList[0],dList[1],dList[2],uBlock);
      
        
    }
     public initFile(fname): boolean{ // creating the file listing
        let location = [];
        for(let l of _HardDisk.dirRecs){
            if(_DSDD.readBlock(DSDD.labelToArr(l)) ==DSDD.blankBlock){
               location = DSDD.labelToArr(l);
               break;
            }
        }
        if(FileSystem.validAddr(location)){ // checking that the file is going to a valid place

            let nameInHex = DSDD.strToHex(fname);
            _HardDisk.setBlock(location[0], location[1], location[2], `99999901${nameInHex}`);
            
            _KernelInterruptQueue.enqueue(new TSOS.Interrupt(DISK_UPDATE, []));
            return true;
        }else{
            //throw interrupt
            return false;
        }
        return true;
     }   

     public writeToFile(fname,data, rawData): boolean{
         if(!FileSystem.validAddr(this.findFileDirRecord(fname))){
             return false;
             //throw error
         }else if(data == "" || data == null){
            return true;
         }else{
            if(!rawData){
                let cData = this.readFromFile(fname, false);
                if(cData.length > 0){
                    
                }
            }
            
            
            
            let fStart = _DSDD.writeData(data, rawData);
            if(FileSystem.validAddr(fStart)){
                
                this.setFileStart(fname, fStart);
                _KernelInterruptQueue.enqueue(new TSOS.Interrupt(DISK_UPDATE, []));
                return true;
            }else{
                return false;
            }
         }
     }
    
     public deleteFile(fname): boolean{
        let dirStartAddr =  this.findFileDirRecord(fname);
        if(!FileSystem.validAddr(dirStartAddr)){
            return false;
            //throw error
        }else{
            let cBlkAddr = this.getNextBlock(_DSDD.readBlock(dirStartAddr)); // stores the addr of the first real block
            let eof = false;
            let nPlace = [];
            while(!eof){
                let cBlock = _DSDD.readBlock(cBlkAddr);
                nPlace = this.getNextBlock(cBlock);
                if(!FileSystem.validAddr(nPlace)){
                    eof = true;
                }
                _DSDD.deleteBlock(cBlkAddr); // emphasis on delete and not clear. When things get deleted, they dont really go away
                cBlkAddr = nPlace;//clear it
                //set a new clBlock

            }
            _DSDD.clearBlock(dirStartAddr);
            _KernelInterruptQueue.enqueue(new TSOS.Interrupt(DISK_UPDATE, []));
            return true;
        }
     }


    public readFromFile(fName, rawData): string{ // iterativley reading out file contents from all blocks
        let fListing = this.findFileDirRecord(fName);
       // //console.log("got to fs");
       // return "12345";
       
        if(!FileSystem.validAddr(fListing)){
            return "--";
        }else{
            let cData = _DSDD.readBlock(fListing);
            let dataBuffer = "";
            //console.log("Befff"+ cData);
            let cRData = cData.substr(8);
           // dataBuffer = dataBuffer + cRData;
            let nextPlace = this.getNextBlock(cData);
            if(FileSystem.validAddr(nextPlace)){
                //console.log("got in here next");
                let hasNext = true;
                while(hasNext){
                    cData = _DSDD.readBlock(nextPlace);
                    if(!cData){
                        break;
                    }
                    cRData = cData.substr(8);
                    // //console.log(cData);
                    dataBuffer = dataBuffer + cRData;
                   // //console.log("current buffer: "+FileSystem.hexToStr(dataBuffer))
                    nextPlace = this.getNextBlock(cData);
                    if(nextPlace == []){
                        hasNext = false;
                    }
                    
                }
            }
            if(rawData){
                return dataBuffer;
            }else{
                return FileSystem.hexToStr(dataBuffer);
            }
            
        }
    }

    public getNextBlock(blk):number[] { // helper function to file reading
        let nAddr = blk.substr(0,6);
        //console.log("jumping to "+ nAddr);
        if(nAddr == "999999" || nAddr == "000000"){
            return [];
        }else{
            let t = parseInt(nAddr.substr(0,2),16);
            let s = parseInt(nAddr.substr(2,2),16);
            let b = parseInt(nAddr.substr(4,2),16);
            //console.log("jumping to" + [t,s,b].toString());
            
            return  [t,s,b];
        }
    }

    public listFiles():string[]{ // used by the ls command
        let files = [];
        for(let i = 0;i<_HardDisk.dirRecs.length;i++){
            let blk = _DSDD.readBlock(DSDD.strToArr(_HardDisk.dirRecs[i]));
            if(blk.substr(7,2) != "00"){
                
                
                let fName = FileSystem.hexToStr(blk.substr(8));
                if(fName.substr(0,1) != "."){
                    files[files.length] = fName;
                }
            }
        }
        return files;
    }


    public makeSwapFile(inputCode, pid: number): boolean{ // generate a swap file for memory swap
        let fName = "."+ (++this.swpCnt).toString();
        //console.log("original sqp data");
        ////console.log(inputCode.join(''));
       // let jCode = inputCode.join('');
        let isInit = this.initFile(fName);
        if(isInit){
            let didWrite;
            if(Array.isArray(inputCode)){
                //console.log("got in here");
                let jIn = inputCode.join('');
               didWrite = this.writeToFile(fName,jIn, true);
            } else{
                didWrite = this.writeToFile(fName,inputCode, true);

            }
            
            if(didWrite){
                this.swpMap.set(pid,fName);
                return true;
            }
                      
        }
        return false;
    }
    public swapIn(nPcb: TSOS.PCB, oPcb: TSOS.PCB): boolean{ // grabbing a pcb's data by pid and replacing it with the thing it is taking the place of
        //console.log("old pcb" + oPcb.pid);
        let oldPcbLoc = _MemoryManager.segAllocStatus.indexOf(oPcb.pid);
        let oldPcbData = _MemoryManager.dumpFullSeg(oldPcbLoc).join('');
       // //console.log("original sqp data");
        ////console.log(oldPcbData.join(''));
        let isSwappedOut = this.makeSwapFile(oldPcbData, oPcb.pid);
        if(isSwappedOut){

            let newData = this.readFromFile(this.swpMap.get(nPcb.pid), true);
            let del = this.deleteFile(this.swpMap.get(nPcb.pid));
            this.swpMap.delete(nPcb.pid);
            if(!del){
                return false;
            }
            _MemoryManager.clearMemoryPerSeg(oldPcbLoc);
            _MemoryManager.loadMemoryStrict(newData, oldPcbLoc);
            _MemoryManager.segAllocStatus[oldPcbLoc] = nPcb.pid;
            nPcb.base = (oldPcbLoc * 256).toString(16);
            nPcb.limit = ((oldPcbLoc * 256)+ 255).toString(16);
            _Scheduler.pcbLocSet.set(oPcb.pid, ON_DISK);
            _Scheduler.pcbLocSet.set(nPcb.pid, IN_MEM);
            return true;
        }
        return false;
    }


    public onlySwapIn(nPcb:TSOS.PCB, segPlace: number):boolean{ // used at the start of processes to simply grab something from storage
        let newData = this.readFromFile(this.swpMap.get(nPcb.pid), true);
        let del = this.deleteFile(this.swpMap.get(nPcb.pid));
        this.swpMap.delete(nPcb.pid);
        if(!del){
            return false;
        }
        _MemoryManager.clearMemoryPerSeg(segPlace);
        _MemoryManager.loadMemoryStrict(newData, segPlace);
        _MemoryManager.segAllocStatus[segPlace] = nPcb.pid;
        nPcb.base = (segPlace * 256).toString(16);
        nPcb.limit = ((segPlace * 256)+ 255).toString(16);
        // _Scheduler.pcbLocSet.set(oPcb.pid, ON_DISK);
        _Scheduler.pcbLocSet.set(nPcb.pid, IN_MEM);
        return true;
    }

    public deleteSwpFile(pid: number){
        this.deleteFile(this.swpMap.get(pid));
    }
    public static validAddr(arr):boolean{
        return ((arr[0] + arr[1] + arr[2]) > -1);
    }
    public static hexToStr(hx):string{ // helper function
        let hex  = hx.toString();
	    let str = '';
	    for (let n = 0; n < hex.length; n += 2) {
	    	str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
	    }
	    return str;
    }
}
}
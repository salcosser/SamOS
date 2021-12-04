module TSOS{
    export class DSDD extends DeviceDriver{

        public static blankBlock = "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
        public isFormatted = false;

        constructor() {
            // Override the base method pointers.

            // The code below cannot run because "this" can only be
            // accessed after calling super.
            // super(this.krnKbdDriverEntry, this.krnKbdDispatchKeyPress);
            // So instead...
            super();
            this.driverEntry = this.dskDriverEntry;
            this.isr = this.krnDskAccess;
        }


        public dskDriverEntry() {
            // Initialization routine for this, the kernel-mode Keyboard Device Driver.
            this.status = "loaded";
            // More?
        }


        public krnDskAccess(params){
            // not used
        }





            //findOpenSpace
            public findOpenSpace(): string{
                for(let l of _HardDisk.realAddrs){
                    if(this.readBlock(DSDD.labelToArr(l)).substr(7,1) == "0"){
                        return l;
                    }
                }
                return "";
            }
            public clearBlock(blkAddr){
                _HardDisk.setBlock(blkAddr[0],blkAddr[1],blkAddr[2],DSDD.blankBlock);
            }
            public writeData(data): number[]{
                let start = this.findOpenSpace();
                if(start === ""){
                    return [];
                }
                
                let tData = DSDD.strToHex(data);
                let lastPlace = [];
                let wAddrs = [];
                while(tData.length > 0){
                    
                    let tBlock = tData.substr(0,120);
                    if(tData.length == data.length && tData.length > 120){

                      //  tBlock = "01"+ DSDD.labelToString(start) + tBlock ;
                      tBlock = DSDD.arrToString(start)+"01"+ tBlock;
                     
                      let lablArr = DSDD.labelToArr(start);   
                     _HardDisk.setBlock(lablArr[0], lablArr[1],lablArr[2], tBlock);
                     wAddrs[wAddrs.length] = DSDD.arrToString(lablArr);
                     lastPlace = lablArr;   
                    }else if(tData.length > 120){
                        let next = this.findOpenSpace();
                        if(next === "XX:XX:XX"){
                            this.writeRollback(wAddrs);
                            return [];
                        }
                        let lBlock = _HardDisk.getBlock(lastPlace[0],lastPlace[1],lastPlace[2]).substr(8);
                        lBlock = DSDD.labelToString(next) + "01"+ lBlock;
                        _HardDisk.setBlock(lastPlace[0],lastPlace[1],lastPlace[2],lBlock);
                        
                        tBlock = "99999901"+ tBlock;
                        let lablArr = DSDD.labelToArr(next);   
                        _HardDisk.setBlock(lablArr[0], lablArr[1],lablArr[2], tBlock);
                        wAddrs[wAddrs.length] = DSDD.arrToString(lablArr);
                        let uBlock = _HardDisk.getBlock(lastPlace[0], lastPlace[1], lastPlace[2]);
                        uBlock=  DSDD.arrToString(lablArr) + uBlock.substr(6);
                        _HardDisk.setBlock(lastPlace[0], lastPlace[1], lastPlace[2], uBlock);
                        lastPlace = lablArr;


                    }else{
                        let next = this.findOpenSpace();
                        if(next === "XX:XX:XX"){
                            this.writeRollback(wAddrs);
                            return [];
                        }
                        let lBlock = _HardDisk.getBlock(lastPlace[0],lastPlace[1],lastPlace[2]).substr(8);
                        lBlock = DSDD.labelToString(next) + "01"+ lBlock;
                        _HardDisk.setBlock(lastPlace[0],lastPlace[1],lastPlace[2],lBlock);



                        tBlock = "99999901"+ tBlock;
                        let lablArr = DSDD.labelToArr(next);   
                        _HardDisk.setBlock(lablArr[0], lablArr[1],lablArr[2], tBlock);
                        wAddrs[wAddrs.length] = DSDD.arrToString(lablArr);
                        break;
                    }

                    tData = tData.substr(120);
                }
                
                return DSDD.strToArr(start);
            }
            //readSpace(start)
            //clearSpace
            //format
            public writeRollback(addrArr){
                for(let addr  of addrArr){
                    let tAddr = DSDD.strToArr(addr);
                    _HardDisk.setBlock(tAddr[0],tAddr[1], tAddr[2], DSDD.blankBlock);

                }
            }

            
            public readBlock(blkAddr: number[]):string{
                return _HardDisk.getBlock(blkAddr[0],blkAddr[1],blkAddr[2]);
            }


            public formatDisk(): void{
                for(let addr of _HardDisk.addrLabels){
                    let addrArr = DSDD.labelToArr(addr);
                    _HardDisk.setBlock(addrArr[0],addrArr[1],addrArr[2], DSDD.blankBlock );
                }
                
                _KernelInterruptQueue.enqueue(new TSOS.Interrupt(DISK_UPDATE, []));
                this.isFormatted = true;
                console.log("Hard Disk Formatted.");
              //  console.log(_HardDisk.hardDiskSet.size);
            }

            public static strToHex(str){  
	            var arr = [];
	            for(var i = 0, l = str.length; i < l; i++) {
	            	var hex = Number(str.charCodeAt(i)).toString(16);
	            	arr.push(hex);
	            }
	            return arr.join('');
            }

            public static labelToString(label): string{
                let t =  "0" + label.substr(0,1);
                let s =  "0" + label.substr(2,1);
                let b =  "0" + label.substr(4,1);
                return (t+s+b);
            }
            public static stringToLabel(str): string{
                let t = parseInt(str.substr(0,2));
                let s = parseInt(str.substr(2,2));
                let b = parseInt(str.substr(4,2));
                return (t+":"+s+":"+b);
            }

            public static strToArr(str): number[]{
                let arr = [];
                arr[arr.length] = parseInt(str.substr(0,2));
                arr[arr.length] = parseInt(str.substr(2,2));
                arr[arr.length] = parseInt(str.substr(4,2));
                return arr;
            }
            public static labelToArr(label):number[]{
                let arr = [];
                arr[arr.length] = parseInt(label.substr(0,1));
                arr[arr.length] = parseInt(label.substr(2,1));
                arr[arr.length] = parseInt(label.substr(4,1));
                return arr;
            }
            public static arrToString(arr): string{
                let t =  "0" + arr[0];
                let s =  "0" + arr[1];
                let b =  "0" + arr[2];
                return (t+s+b);
            }
    }
}
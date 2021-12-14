/* ------------
     Kernel.ts

     Routines for the Operating System, NOT the host.

     This code references page numbers in the text book:
     Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
     ------------ */

module TSOS {

    export class Kernel {
        //
        // OS Startup and Shutdown Routines
        //
        public krnBootstrap() {      // Page 8. {
            Control.hostLog("bootstrap", "host");  // Use hostLog because we ALWAYS want this, even if _Trace is off.

            // Initialize our global queues.
            _KernelInterruptQueue = new Queue();  // A (currently) non-priority queue for interrupt requests (IRQs).
            _KernelBuffers = new Array();         // Buffers... for the kernel.
            _KernelInputQueue = new Queue();      // Where device input lands before being processed out somewhere.

            // Initialize the console.
            _Console = new Console();             // The command line interface / console I/O device.
            _Console.init();

            // Initialize standard input and output to the _Console.
            _StdIn  = _Console;
            _StdOut = _Console;
            
            
           
            _HardDisk = new HardDisk();
            _HardDisk.init();
            _FileSystem = new FileSystem();

           // 

            _MemoryManager = new MemoryManager();

            _Dispatcher = new Dispatcher();


            // Load the Keyboard Device Driver
            this.krnTrace("Loading the keyboard device driver.");
            _krnKeyboardDriver = new DeviceDriverKeyboard();     // Construct it.
            _krnKeyboardDriver.driverEntry();                    // Call the driverEntry() initialization routine.
            this.krnTrace(_krnKeyboardDriver.status);

            this.krnTrace("Loading the disk device driver.");
            _DSDD = new DSDD();     // Construct it.
            _DSDD.driverEntry();                    // Call the driverEntry() initialization routine.
            this.krnTrace(_DSDD.status);


            //
            // ... more?
            //

            // Enable the OS Interrupts.  (Not the CPU clock interrupt, as that is done in the hardware sim.)
            this.krnTrace("Enabling the interrupts.");
            this.krnEnableInterrupts();

            // Launch the shell.
            this.krnTrace("Creating and Launching the shell.");
            _OsShell = new Shell();
            _OsShell.init();

            // Finally, initiate student testing protocol.
            if (_GLaDOS) {
                _GLaDOS.afterStartup();
            }
        }

        public krnShutdown() {
            this.krnTrace("begin shutdown OS");
            // TODO: Check for running processes.  If there are some, alert and stop. Else...
            // ... Disable the Interrupts.
            this.krnTrace("Disabling the interrupts.");
            this.krnDisableInterrupts();
            //
            // Unload the Device Drivers?
            // More?
            //
            this.krnTrace("end shutdown OS");
            clearInterval(_hardwareClockID);

        }


        public krnOnCPUClockPulse() {
            /* This gets called from the host hardware simulation every time there is a hardware clock pulse.
               This is NOT the same as a TIMER, which causes an interrupt and is handled like other interrupts.
               This, on the other hand, is the clock pulse from the hardware / VM / host that tells the kernel
               that it has to look for interrupts and process them if it finds any.                          
            */
               
            // Check for an interrupt, if there are any. Page 560
            
            if (_KernelInterruptQueue.getSize() > 0) {
                // Process the first interrupt on the interrupt queue.
                // TODO (maybe): Implement a priority queue based on the IRQ number/id to enforce interrupt priority.
                var interrupt = _KernelInterruptQueue.dequeue();
                this.krnInterruptHandler(interrupt.irq, interrupt.params);
            } else if (_CPU.isExecuting) { // If there are no interrupts then run one CPU cycle if there is anything being processed.
                _Mode = 0;
                if(_Scheduler.cAlgo == RR || _Scheduler.cAlgo == FCFS){
                    _Scheduler.preemptive();
                }else{
                    _Scheduler.priority();
                }


                
               if(_CPU.isExecuting){ // did anything change?
                 _Mode = 1;
                 _CPU.cycle();
               }
                _Mode = 0;
                this.updatePCBInfo();
                this.updateMemViewer();
                this.updateProcViewer();
            } else {                       // If there are no interrupts and there is nothing being executed then just be idle.
                this.krnTrace("Idle");
            }
           
        }



        //
        // Interrupt Handling
        //
        public krnEnableInterrupts() {
            // Keyboard
            Devices.hostEnableKeyboardInterrupt();
            // Put more here.
        }

        public krnDisableInterrupts() {
            // Keyboard
            Devices.hostDisableKeyboardInterrupt();
            // Put more here.
        }

        public krnInterruptHandler(irq, params) {
            // This is the Interrupt Handler Routine.  See pages 8 and 560.
            // Trace our entrance here so we can compute Interrupt Latency by analyzing the log file later on. Page 766.
            this.krnTrace("Handling IRQ~" + irq);

            // Invoke the requested Interrupt Service Routine via Switch/Case rather than an Interrupt Vector.
            // TODO: Consider using an Interrupt Vector in the future.
            // Note: There is no need to "dismiss" or acknowledge the interrupts in our design here.
            //       Maybe the hardware simulation will grow to support/require that in the future.
            switch (irq) {
                case TIMER_IRQ:
                    this.krnTimerISR();               // Kernel built-in routine for timers (not the clock).
                    break;
                case KEYBOARD_IRQ:
                    _krnKeyboardDriver.isr(params);   // Kernel mode device driver
                    _StdIn.handleInput();
                    break;
                case END_PROC_IRQ:  
                    _Scheduler.termProc(params[0]);
                   // _Scheduler.sync();
                    this.updateProcViewer();
                    _StdOut.advanceLine();
                    _StdOut.putText(`Program with pid ${params[0]} has ended`);
                    _StdOut.advanceLine();
                    _OsShell.putPrompt();
                    break;
                case KILL_PROC_IRQ:
                    _Scheduler.termRunningProc(params[0]);
                    this.updateProcViewer();
                    _StdOut.advanceLine();
                    _StdOut.putText(`Program with pid ${params[0]} has been stopped`);
                    _StdOut.advanceLine();
                    _OsShell.putPrompt();
                    break;
                case PRINT_YREG_IRQ:
                     _StdOut.putText(parseInt(params[0],16).toString());
                     break;
                case PRINT_FROM_MEM_IRQ:
                    let addr = params[0];
                    let memVal = _MemoryManager.getMemory(addr);
                    let res = "";
                    while(memVal !== "00"){
                        res+= String.fromCharCode(parseInt(memVal,16));
                        addr = (parseInt(addr,16)+1).toString(16);
                        memVal= _MemoryManager.getMemory(addr).toString(16);
                    }
                    _StdOut.putText(res);
                    
                    break;
                case FINISHED_PROC_QUEUE:
                    //console.log("called end processing");
                    _CPU.isExecuting = false;
                    _Kernel.updateProcViewer();
                    _Scheduler.runningPID = -1;
                    _Kernel.clearCPU();
                    _Kernel.updatePCBInfo();
                    _StdOut.putText("All processes have completed.");
                    _StdOut.advanceLine();
                    _OsShell.putPrompt();
                    break;
                case MEM_BOUNDS_ERR_R:
                    _CPU.isExecuting = false;
                    this.krnTrapError(`Memory out of bounds error. proc with pid[${params[0]}] tried to read memory address ${params[1]}, which is ${params[2]} bytes outside of it's memory bounds.`);
                    break;
                case MEM_BOUNDS_ERR_W:
                    _CPU.isExecuting = false;
                    this.krnTrapError(`Memory out of bounds error. proc with pid[${params[0]}] tried to write to memory address ${params[1]}, which is ${params[2]} bytes outside of it's memory bounds.`);
                    break;
                case DISK_UPDATE:
                    this.updateDiskViewer();
                    break;
                case DSK_FORMAT:
                    _DSDD.formatDisk();
                    break;
                default:
                    this.krnTrapError("Invalid Interrupt Request. irq=" + irq + " params=[" + params + "]");
            }
        }

        public krnTimerISR() {
            // The built-in TIMER (not clock) Interrupt Service Routine (as opposed to an ISR coming from a device driver). {
            // Check multiprogramming parameters and enforce quanta here. Call the scheduler / context switch here if necessary.
            // Or do it elsewhere in the Kernel. We don't really need this.
        }

        //
        // System Calls... that generate software interrupts via tha Application Programming Interface library routines.
        //
        // Some ideas:
        // - ReadConsole
        // - WriteConsole
        // - CreateProcess
        // - ExitProcess
        // - WaitForProcessToExit
        // - CreateFile
        // - OpenFile
        // - ReadFile
        // - WriteFile
        // - CloseFile


        //
        // OS Utility Routines
        //
        public krnTrace(msg: string) {
             // Check globals to see if trace is set ON.  If so, then (maybe) log the message.
             if (_Trace) {
                if (msg === "Idle") {
                    // We can't log every idle clock pulse because it would quickly lag the browser quickly.
                    if (_OSclock % 10 == 0) {
                        // Check the CPU_CLOCK_INTERVAL in globals.ts for an
                        // idea of the tick rate and adjust this line accordingly.
                        Control.hostLog(msg, "OS");
                    }
                } else {
                    Control.hostLog(msg, "OS");
                }
             }
        }
        public updatePCBInfo(): void{
            document.getElementById("PC").innerHTML = _CPU.PC;
            document.getElementById("IR").innerHTML = _CPU.IR;
            document.getElementById("ACC").innerHTML = _CPU.Acc;
            document.getElementById("xReg").innerHTML = _CPU.Xreg;
            document.getElementById("yReg").innerHTML = _CPU.Yreg;
            document.getElementById("zFlg").innerHTML = _CPU.Zflag;
        }

        // used to update the memory viewer, as well as give an idea of where the program is in processing
        public updateMemViewer(){
            
              
                let actualLocation = (parseInt(_CPU.PC,16) + ((_MemoryManager.segAllocStatus.indexOf(_Scheduler.runningPID)) * 256)).toString(16);


                let realMemInd = 0;
                for(let i = 0;i<32 ;i++){
                    for(let j = 1;j<=8;j++){                   
                        document.getElementById("memTableRows").getElementsByTagName("tr")[i].cells[j].innerHTML = _MemoryManager.getMemoryPerSeg(realMemInd.toString(16),0).toString(16);
                        document.getElementById("memTableRows").getElementsByTagName("tr")[i].cells[j].style.backgroundColor = "lightgray";
                        document.getElementById("memTableRows").getElementsByTagName("tr")[i].cells[j].style.fontWeight = "normal";
                        document.getElementById("memTableRows").getElementsByTagName("tr")[i].cells[j].style.color = "black";
                        if(realMemInd.toString(16).toUpperCase() == actualLocation){
                            document.getElementById("memTableRows").getElementsByTagName("tr")[i].cells[j].style.fontWeight = "bold";
                            document.getElementById("memTableRows").getElementsByTagName("tr")[i].cells[j].style.color = "lightgreen";
                            document.getElementById("memTableRows").getElementsByTagName("tr")[i].cells[j].style.backgroundColor = "black";
                        }
                        realMemInd++;
                        
                    }   
                }    
                realMemInd = 0;
                for(let i = 32;i<64 ;i++){
                    for(let j = 1;j<=8;j++){                   
                        document.getElementById("memTableRows").getElementsByTagName("tr")[i].cells[j].innerHTML = _MemoryManager.getMemoryPerSeg(realMemInd.toString(16),1).toString(16);
                        document.getElementById("memTableRows").getElementsByTagName("tr")[i].cells[j].style.backgroundColor = "lightgray";
                        document.getElementById("memTableRows").getElementsByTagName("tr")[i].cells[j].style.fontWeight = "normal";
                        document.getElementById("memTableRows").getElementsByTagName("tr")[i].cells[j].style.color = "black";
                        if(realMemInd.toString(16).toUpperCase() == actualLocation){
                            document.getElementById("memTableRows").getElementsByTagName("tr")[i].cells[j].style.fontWeight = "bold";
                            document.getElementById("memTableRows").getElementsByTagName("tr")[i].cells[j].style.color = "lightgreen";
                            document.getElementById("memTableRows").getElementsByTagName("tr")[i].cells[j].style.backgroundColor = "black";
                        }
                        realMemInd++;
                        
                    }   
                }  
                realMemInd = 0;
                for(let i = 64;i<96 ;i++){
                    for(let j = 1;j<=8;j++){                   
                        document.getElementById("memTableRows").getElementsByTagName("tr")[i].cells[j].innerHTML = _MemoryManager.getMemoryPerSeg(realMemInd.toString(16),2).toString(16);
                        document.getElementById("memTableRows").getElementsByTagName("tr")[i].cells[j].style.backgroundColor = "lightgray";
                        document.getElementById("memTableRows").getElementsByTagName("tr")[i].cells[j].style.fontWeight = "normal";
                        document.getElementById("memTableRows").getElementsByTagName("tr")[i].cells[j].style.color = "black";
                        if(realMemInd.toString(16).toUpperCase() == actualLocation){
                            document.getElementById("memTableRows").getElementsByTagName("tr")[i].cells[j].style.fontWeight = "bold";
                            document.getElementById("memTableRows").getElementsByTagName("tr")[i].cells[j].style.color = "lightgreen";
                            document.getElementById("memTableRows").getElementsByTagName("tr")[i].cells[j].style.backgroundColor = "black";
                        }
                        realMemInd++;
                       
                    }   
                }  
               
            }    
        





            public updateProcViewer(): void{
                let pcbSet = new Map();
                let rTable = document.getElementById("pcbTable") as HTMLTableElement;
                    while(rTable.rows.length > 1){
                        rTable.rows[rTable.rows.length -1].remove();
                    }
                if(_Scheduler.runningPID != -1){
                    let rPcb = new Map();

                    rPcb.set("pid", _Scheduler.runningPID);
                    rPcb.set("seg",_MemoryManager.segAllocStatus.indexOf(_Scheduler.runningPID));
                    rPcb.set("pc", _CPU.PC);
                    rPcb.set("ir", _CPU.IR);
                    rPcb.set("acc", _CPU.Acc);
                    rPcb.set("xr", _CPU.Xreg);
                    rPcb.set("yr", _CPU.Yreg);
                    rPcb.set("zf", _CPU.Zflag);
                    rPcb.set("st","Running");
                    rPcb.set("dsk", "N/A");
                    pcbSet.set(_Scheduler.runningPID, rPcb);
                    


                    // let rRow = rTable.insertRow(-1);
        
                    // for(let i = 0;i<9;i++){
                    //         rRow.insertCell(i);
                    // }
                    // rRow.cells[0].innerHTML = _Scheduler.runningPID;
                    // rRow.cells[1].innerHTML = _MemoryManager.segAllocStatus.indexOf(_Scheduler.runningPID);
                    // rRow.cells[2].innerHTML = _CPU.PC;
                    // rRow.cells[3].innerHTML = _CPU.IR;
                    // rRow.cells[4].innerHTML = _CPU.Acc;
                    // rRow.cells[5].innerHTML = _CPU.Xreg;
                    // rRow.cells[6].innerHTML = _CPU.Yreg;
                    // rRow.cells[7].innerHTML = _CPU.Zflag;
                    // rRow.cells[8].innerHTML = "Running";
                    // rRow.style.backgroundColor = "rgba(230, 114, 100, 0.65)";
                }
               
               
                for(let pcb of _Scheduler.readyQueue.q){
                    // let table = document.getElementById("pcbTable");
                    // let row = table.insertRow(-1);
                    // for(let i = 0;i<9;i++){
                    //     row.insertCell(i);
                    // }
                    let rdPcb = new Map();
                    rdPcb.set("pid",pcb.pid);
                    if(_MemoryManager.segAllocStatus.indexOf(pcb.pid) != -1){
                        rdPcb.set("seg",_MemoryManager.segAllocStatus.indexOf(pcb.pid));
                    }else{
                        rdPcb.set("seg","N/A");
                    }
                    
                    if(_FileSystem.swpMap.get(pcb.pid) != null){
                        rdPcb.set("dsk", "0");
                    }else{
                        rdPcb.set("dsk","N/A")
                    }

                    rdPcb.set("pc",pcb.PC);
                    rdPcb.set("ir",pcb.IR);
                    rdPcb.set("acc",pcb.Acc);
                    rdPcb.set("xr",pcb.xReg);
                    rdPcb.set("yr",pcb.yReg);
                    rdPcb.set("zf",pcb.zFlag);
                    let state = "Ready";
                    switch(pcb.state){
                        case RESIDENT:
                            state = "Resident";
                            break;
                        case READY:
                            state = "Ready";
                            break;
                        case RUNNING:
                            state = "Running";
                            break;
                        case TERMINATED:
                            state = "Terminated";
                            break;
                        default:
                            //
                    }
    
    
                    rdPcb.set("st",state);
                    pcbSet.set(pcb.pid, rdPcb);
    
                }
              
                let keySet = Array.from(pcbSet.keys());
                keySet.sort();

                for(let key of keySet){
                    let nRowData = pcbSet.get(key);
                     let rRow = rTable.insertRow(-1);
        
                    for(let i = 0;i<10;i++){
                            rRow.insertCell(i);
                    }
                    rRow.cells[0].innerHTML = nRowData.get("pid");
                    rRow.cells[1].innerHTML = nRowData.get("seg");
                    rRow.cells[2].innerHTML = nRowData.get("dsk");
                    rRow.cells[3].innerHTML = nRowData.get("pc");
                    rRow.cells[4].innerHTML = nRowData.get("ir");
                    rRow.cells[5].innerHTML = nRowData.get("acc");
                    rRow.cells[6].innerHTML = nRowData.get("xr");
                    rRow.cells[7].innerHTML = nRowData.get("yr");
                    rRow.cells[8].innerHTML = nRowData.get("zf");
                    rRow.cells[9].innerHTML = nRowData.get("st");
                    if(nRowData.get("st") == "Running"){
                        rRow.style.backgroundColor = "rgba(230, 114, 100, 0.65)";
                    }
                   
                }

    
    
    
                //pcbTable
            }







            public clearCPU(): void{
                    _CPU.PC    = "00";
                    _CPU.Acc   = "00";
                    _CPU.Xreg  = "00";
                    _CPU.Yreg  = "00";
                    _CPU.IR    = "00";
                    _CPU.Zflag = "00";
                    _CPU.isExecuting = false;
            }

        public updateDiskViewer(): void{
            for(let i = 0;i< _HardDisk.addrLabels.length;i++){
                let tadAr = DSDD.labelToArr(_HardDisk.addrLabels[i]);
                let blk = _DSDD.readBlock(tadAr);

                (<HTMLElement> document.getElementById("HDContainer").getElementsByTagName("tr")[i].cells[1]).innerHTML = blk.substr(0,2);
                (<HTMLElement> document.getElementById("HDContainer").getElementsByTagName("tr")[i].cells[2]).innerHTML = blk.substr(2,2);
                (<HTMLElement> document.getElementById("HDContainer").getElementsByTagName("tr")[i].cells[3]).innerHTML = blk.substr(4,2);
                (<HTMLElement> document.getElementById("HDContainer").getElementsByTagName("tr")[i].cells[4]).innerHTML = blk.substr(6,2);
                (<HTMLElement> document.getElementById("HDContainer").getElementsByTagName("tr")[i].cells[5]).innerHTML = blk.substr(8);
            }
        }


        public krnTrapError(msg) {
            Control.hostLog("OS ERROR - TRAP: " + msg);
            // TODO: Display error on console, perhaps in some sort of colored screen. (Maybe blue?)
            _StdOut.clearScreen();
            _StdOut.resetXY();
            _DrawingContext.fillStyle = "white";
            document.getElementById("display").style.backgroundColor = "blue";  //putting the B in BSOD
            _StdOut.putText(msg + " - A Fatal Error has occured.");
            alert("What did you do!!!!!!");
           
            _Kernel.krnShutdown();

        }
    }
}

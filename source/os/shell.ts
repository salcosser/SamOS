/* ------------
   Shell.ts

   The OS Shell - The "command line interface" (CLI) for the console.

    Note: While fun and learning are the primary goals of all enrichment center activities,
          serious injuries may occur when trying to write your own Operating System.
   ------------ */

// TODO: Write a base class / prototype for system services and let Shell inherit from it.

module TSOS {
    export class Shell {
        // Properties
        public promptStr = ">";
        public commandList = [];
        public curses = "[fuvg],[cvff],[shpx],[phag],[pbpxfhpxre],[zbgureshpxre],[gvgf]";
        public apologies = "[sorry]";
        public printLen = new Map(); // used to store predetermined line accomodation amounts for each command
        
        constructor() {
        }

        public init() {
            if(sessionStorage.getItem("commOptionIndex")){  // resetting all of the session variables
                sessionStorage.removeItem("commOptionIndex");
                sessionStorage.removeItem("possOptions");
                sessionStorage.removeItem("baseString");
               
            }
            sessionStorage.removeItem("commHistory");
            sessionStorage.setItem("lCommInd", "0");
            var sc: ShellCommand;
            //
            // Load the command list.

            // ver
            sc = new ShellCommand(this.shellVer,
                                  "ver",
                                  "- Displays the current version data.");
            this.commandList[this.commandList.length] = sc;
                                               

            // help
            sc = new ShellCommand(this.shellHelp,
                                  "help",
                                  "- This is the help command. Seek help.");
            this.commandList[this.commandList.length] = sc;
           

            // shutdown
            sc = new ShellCommand(this.shellShutdown,
                                  "shutdown",
                                  "- Shuts down the virtual OS but leaves the underlying host / hardware simulation running.");
            this.commandList[this.commandList.length] = sc;


            // cls
            sc = new ShellCommand(this.shellCls,
                                  "cls",
                                  "- Clears the screen and resets the cursor position.");
            this.commandList[this.commandList.length] = sc;
           

            // man <topic>
            sc = new ShellCommand(this.shellMan,
                                  "man",
                                  "<topic> - Displays the MANual page for <topic>.");
            this.commandList[this.commandList.length] = sc;
        

            // trace <on | off>
            sc = new ShellCommand(this.shellTrace,
                                  "trace",
                                  "<on | off> - Turns the OS trace on or off.");
            this.commandList[this.commandList.length] = sc;
            

            // rot13 <string>
            sc = new ShellCommand(this.shellRot13,
                                  "rot13",
                                  "<string> - Does rot13 obfuscation on <string>.");
            this.commandList[this.commandList.length] = sc;
          

            // prompt <string>
            sc = new ShellCommand(this.shellPrompt,
                                  "prompt",
                                  "<string> - Sets the prompt.");
            this.commandList[this.commandList.length] = sc;
           
            // ps  - list the running processes and their IDs
            // kill <id> - kills the specified process id.
            


            // date command
            sc = new ShellCommand(this.shellDate,
                                 "date",
                                 "- displays the current date and time.");
            this.commandList[this.commandList.length] = sc;
            
            
            //whereami command
            sc = new ShellCommand(this.shellAmI,
                "whereami",
                "-gives accurate information about a user's current position.");
            this.commandList[this.commandList.length] = sc;
            

            //special command (ufo tracker, uncomment the window.open command in this method for a cool trick)
            sc = new ShellCommand(this.shellUfoTracker,
                "whereistheufo",
                "- opens a google maps tab of the current location of the UFO");
            this.commandList[this.commandList.length] = sc;
          

            //status command
            sc = new ShellCommand(this.shellStatus,
                                "status",
                                "-sets the status of the current session");
            this.commandList[this.commandList.length] = sc;
           
            //load command
            sc = new ShellCommand(this.shellLoadProg,
                                "load",
                                "-Loads the program code provided by the user");
            this.commandList[this.commandList.length] = sc;
           



            sc = new ShellCommand(this.shellTestBsod,
                "testbsod",
                "-Tests blue screen of death");
            this.commandList[this.commandList.length] = sc;


            sc = new ShellCommand(this.shellRun,
                "run",
                "- runs specified PID");
            this.commandList[this.commandList.length] = sc;
           
            // Display the initial prompt.
            this.putPrompt();
        }

        public putPrompt() {
            _StdOut.putText(this.promptStr);
        }

        public handleInput(buffer) {
            _Kernel.krnTrace("Shell Command~" + buffer);
            //
            // Parse the input...
            //
            var userCommand = this.parseInput(buffer);
            // ... and assign the command and args to local variables.
            var cmd = userCommand.command;
            var args = userCommand.args;
            //
            // Determine the command and execute it.
            //
            // TypeScript/JavaScript may not support associative arrays in all browsers so we have to iterate over the
            // command list in attempt to find a match. 
            // TODO: Is there a better way? Probably. Someone work it out and tell me in class.
            var index: number = 0;
            var found: boolean = false;
            var fn = undefined;
            while (!found && index < this.commandList.length) {
                if (this.commandList[index].command === cmd) {
                    found = true;
                    fn = this.commandList[index].func;
                } else {
                    ++index;
                }
            }
            if (found) {
               
                this.execute(fn, args);  // Note that args is always supplied, though it might be empty.
            } else {
                // It's not found, so check for curses and apologies before declaring the command invalid.
                if (this.curses.indexOf("[" + Utils.rot13(cmd) + "]") >= 0) {     // Check for curses.
                    
                    this.execute(this.shellCurse);
                } else if (this.apologies.indexOf("[" + cmd + "]") >= 0) {        // Check for apologies.
                    
                    this.execute(this.shellApology);
                } else { // It's just a bad command. {
                    
                    this.execute(this.shellInvalidCommand);
                   
                }
            }

        }

        // Note: args is an optional parameter, ergo the ? which allows TypeScript to understand that.
        public execute(fn, args?) {
            // We just got a command, so advance the line...
            _StdOut.advanceLine();
            // ... call the command function passing in the args with some über-cool functional programming ...
            fn(args);
            // Check to see if we need to advance the line again
            if (_StdOut.currentXPosition > 0) {
                _StdOut.advanceLine();
            }
            // ... and finally write the prompt again.
            this.putPrompt();
        }

        public parseInput(buffer: string): UserCommand {
            var retVal = new UserCommand();

            // 1. Remove leading and trailing spaces.
            buffer = Utils.trim(buffer);

            // 2. Lower-case it.
            // buffer = buffer.toLowerCase();

            // 3. Separate on spaces so we can determine the command and command-line args, if any.
            var tempList = buffer.split(" ");

            // 4. Take the first (zeroth) element and use that as the command.
            var cmd = tempList.shift().toLowerCase();  // Yes, you can do that to an array in JavaScript. See the Queue class.
            // 4.1 Remove any left-over spaces.
            cmd = Utils.trim(cmd);
            // 4.2 Record it in the return value.
            retVal.command = cmd;

            // 5. Now create the args array from what's left.
            for (var i in tempList) {
                var arg = Utils.trim(tempList[i]);
                if (arg != "") {
                    retVal.args[retVal.args.length] = tempList[i];
                }
            }
            return retVal;
        }

        





        //
        // Shell Command Functions. Kinda not part of Shell() class exactly, but
        // called from here, so kept here to avoid violating the law of least astonishment.
        //
        public shellInvalidCommand() {
            _StdOut.putText("Invalid Command. ");
            if (_SarcasticMode) {
                _StdOut.putText("Unbelievable. You, [subject name here],");
                _StdOut.advanceLine();
                _StdOut.putText("must be the pride of [subject hometown here].");
            } else {
                _StdOut.putText("Type 'help' for, well... help.");
            }
        }

        public shellCurse() {
            _StdOut.putText("Oh, so that's how it's going to be, eh? Fine.");
            _StdOut.advanceLine();
            _StdOut.putText("Bitch.");
            _SarcasticMode = true;
        }

        public shellApology() {
           if (_SarcasticMode) {
              _StdOut.putText("I think we can put our differences behind us.");
              _StdOut.advanceLine();
              _StdOut.putText("For science . . . You monster.");
              _SarcasticMode = false;
           } else {
              _StdOut.putText("For what?");
           }
        }

        // Although args is unused in some of these functions, it is always provided in the 
        // actual parameter list when this function is called, so I feel like we need it.

        public shellVer(args: string[]) {
            _StdOut.putText(APP_NAME + " version " + APP_VERSION);
        }

        public shellHelp(args: string[]) {
            _StdOut.putText("Commands:");
            for (var i in _OsShell.commandList) {
                _StdOut.advanceLine();
                _StdOut.putText("  " + _OsShell.commandList[i].command + " " + _OsShell.commandList[i].description);
            }
        }

        public shellShutdown(args: string[]) {
             _StdOut.putText("Shutting down...");
             // Call Kernel shutdown routine.
            _Kernel.krnShutdown();
            // TODO: Stop the final prompt from being displayed. If possible. Not a high priority. (Damn OCD!)
        }

        public shellCls(args: string[]) {         
            _StdOut.clearScreen();     
            _StdOut.resetXY();
        }

        public shellMan(args: string[]) {
            if (args.length > 0) {
                var topic = args[0];
                switch (topic) {
                    case "help":
                        _StdOut.putText("Help displays a list of (hopefully) valid commands.");
                        break;
                    // TODO: Make descriptive MANual page entries for the the rest of the shell commands here.
                    case "ver":
                        _StdOut.putText("Ver is used show the info about the current version.");
                        break;
                    case "shutdown":
                        _StdOut.putText("Shuts down the virtual OS but leaves the underlying host / hardware simulation running.");
                        break;
                    case "cls":
                        _StdOut.putText("Cls can be used to clear the screen and reset the cursor position.");
                        break;
                    case "man":
                        _StdOut.putText("Usage: man <topic>");
                        _StdOut.advanceLine();
                        _StdOut.putText("used to show the useful info of a given command.");
                        break;
                    case "trace":
                        _StdOut.putText("Usage: trace <on | off>");
                        _StdOut.advanceLine();
                        _StdOut.putText("used to turn on and off the OS trace.");
                        break;
                    case "rot13":
                        _StdOut.putText("Usage: rot13 <string>");
                        _StdOut.advanceLine();
                        _StdOut.putText("obfuscates a string using rot13.");
                        break;
                    case "prompt":
                        _StdOut.putText("Usage: prompt <string>");
                        _StdOut.advanceLine();
                        _StdOut.putText("sets a prompt.");
                        break;
                    case "date":
                        _StdOut.putText("shows the current date and time.");
                        break;
                    case "whereami":
                        _StdOut.putText("Gives positional information about the current user.");
                        break;
                    case "whereistheufo":
                        _StdOut.putText("Usage: whereistheufo | whereistheufo map");
                        _StdOut.advanceLine();
                        _StdOut.putText("Locates nearest ufo, whereistheufo map will even open up a window showing the location");
                        break;
                    case "status":
                        _StdOut.putText("sets the status of the current user.");
                        break;
                    case "load":
                        _StdOut.putText("Loads and validates hex machine code from input.");
                        break;
                    case "testbsod":
                        _StdOut.putText("Tests blue screen of death.");
                        break;
                    case "run":
                        _StdOut.putText("Usage: run <PID>");
                        _StdOut.advanceLine();
                        _StdOut.putText("Runs specified PID.");
                    default:
                        _StdOut.putText("No manual entry for " + args[0] + ".");
                }
            } else {
                _StdOut.putText("Usage: man <topic>  Please supply a topic.");
            }
           

        }

        public shellTrace(args: string[]) {
            if (args.length > 0) {
                var setting = args[0];
                switch (setting) {
                    case "on":
                        if (_Trace && _SarcasticMode) {
                            _StdOut.putText("Trace is already on, doofus.");
                        } else {
                            _Trace = true;
                            _StdOut.putText("Trace ON");
                        }
                        break;
                    case "off":
                        _Trace = false;
                        _StdOut.putText("Trace OFF");
                        break;
                    default:
                        _StdOut.putText("Invalid arguement.  Usage: trace <on | off>.");
                }
            } else {
                _StdOut.putText("Usage: trace <on | off>");
            }
        }

        public shellRot13(args: string[]) {
            if (args.length > 0) {
                // Requires Utils.ts for rot13() function.
                _StdOut.putText(args.join(' ') + " = '" + Utils.rot13(args.join(' ')) +"'");
            } else {
                _StdOut.putText("Usage: rot13 <string>  Please supply a string.");
            }
        }

        public shellPrompt(args: string[]) {
            if (args.length > 0) {
                _OsShell.promptStr = args[0];
            } else {
                _StdOut.putText("Usage: prompt <string>  Please supply a string.");
            }
        }
        // date command
        public shellDate(){
            var today = new Date();
            var months = ["January", "February", "March", "April", "May", "June", "July","August","September", "October", "November", "December"];
            var daysOfWeek = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
            
            var date = daysOfWeek[today.getDay()] + " "+months[(today.getMonth())]+' '+today.getDate()+", "+today.getFullYear(); //building the date portion
            var minutes = today.getMinutes() > 9 ? today.getMinutes() : "0"+today.getMinutes(); //building the time while taking into acount spacing
            var seconds = today.getSeconds() > 9 ? today.getSeconds() : "0"+today.getSeconds();
            var period = "AM";
            var hours = today.getHours();
            if(hours > 11){ // handling edge cases in times
                period = "PM";
                if(hours > 12){
                    hours -= 12;
                }
            }
            if(hours == 0){
                hours = 12;
            }
            
            var time = hours + ":" + minutes + ":" + seconds + " "+period;
            _StdOut.putText(`The current date and time is ${date} ${time}.`);
        }
        // simple little reminder of where you are
        public shellAmI(){
            _StdOut.putText("Somewhere between where you were and where you are going to be.");
            
        }

        //"high tech" ufo tracker
        public shellUfoTracker(version: string[]){
            _StdOut.putText("Locating...");
            _StdOut.advanceLine();
            // _StdOut.putText("Please allow the popup to view the location of the UFO.");
            var x = (Math.random() * 360) - 180;    // making random coordinates
            var y = (Math.random() * 360) - 180;
            // _StdOut.advanceLine();
            _StdOut.putText(`Found them hovering above the GPS coordinates ${x},${y}. `);
            if(version.length != 0){
                window.open(`https://www.google.com/maps/@${x},${y},6.62z`);
            }
            

        }
        // status command for setting status
        public shellStatus(status: string[]): void {
            var stat = status.join(" ");
            document.getElementById("cStatus").innerHTML = stat; // talking directly to the DOM
            _StdOut.putText("Updated the status.");
            _StdOut.advanceLine();
        }
      //loading in the program code and checking it for valid hex
       public shellLoadProg(){
           var inputtedCode = (<HTMLInputElement>document.getElementById("taProgramInput")).value; // casting necessary to get .value
           var strippedCode = inputtedCode.replace(/\s/g, ''); // removing spaces
           if(/^[A-F0-9]+$/i.test(strippedCode)){ // testing against a regex
               
              if(strippedCode.length <= 512){ //saving a computation by not dividing length by 2
                var memList = [];
                var memInd = 0;
                while(memInd < strippedCode.length){
                    memList[memList.length] = strippedCode.substring(memInd, (memInd+2));
                    memInd+=2;
                }

                _Scheduler.setupProcess(memList);// to avoid having the 0s in the data


                if(memList.length < 256){
                    for(let i = memList.length; i < 256;i++){
                        memList[i] = "00";
                    }
                }

               
                var cMemTable = document.getElementById("memTableRows").getElementsByTagName("tr");
              
                var realMemInd = 0;
                for(let i = 0;i<32;i++){
                    
                    document.getElementById("memTableRows").getElementsByTagName("tr")[i].cells[1].innerHTML = memList[realMemInd];
                    realMemInd++;
                    document.getElementById("memTableRows").getElementsByTagName("tr")[i].cells[2].innerHTML = memList[realMemInd];
                    realMemInd++;
                    document.getElementById("memTableRows").getElementsByTagName("tr")[i].cells[3].innerHTML = memList[realMemInd];
                    realMemInd++;
                    document.getElementById("memTableRows").getElementsByTagName("tr")[i].cells[4].innerHTML = memList[realMemInd];
                    realMemInd++;
                    document.getElementById("memTableRows").getElementsByTagName("tr")[i].cells[5].innerHTML = memList[realMemInd];
                    realMemInd++;
                    document.getElementById("memTableRows").getElementsByTagName("tr")[i].cells[6].innerHTML = memList[realMemInd];
                    realMemInd++;
                    document.getElementById("memTableRows").getElementsByTagName("tr")[i].cells[7].innerHTML = memList[realMemInd];
                    realMemInd++;
                    document.getElementById("memTableRows").getElementsByTagName("tr")[i].cells[8].innerHTML = memList[realMemInd];
                    realMemInd++;
                    // console.log("We updated this row.");

                    
                    console.log("in here");
                }    
               



                _StdOut.putText("File loaded. Machine code is valid hex of an acceptable length.");
                _StdOut.advanceLine();
                
                



              }else{
                _StdOut.putText("File could not be loaded. Machine code is valid hex, but program will not fit in memory.");
                _StdOut.advanceLine();
              }
               
              
           }else{
            _StdOut.putText("File could not be loaded. Machine code is not in hexidecimal format.");
            _StdOut.advanceLine();
          
           }
       }
       public shellTestBsod(){
           _Kernel.krnTrapError("BSOD TEST");
       }
       public shellRun( pid: string[]){
            _Scheduler.runProcess(pid[0]);
            _StdOut.putText(`PID ${pid[0]} has started.`);
            _StdOut.advanceLine();
       }

    }
}

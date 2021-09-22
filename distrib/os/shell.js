/* ------------
   Shell.ts

   The OS Shell - The "command line interface" (CLI) for the console.

    Note: While fun and learning are the primary goals of all enrichment center activities,
          serious injuries may occur when trying to write your own Operating System.
   ------------ */
// TODO: Write a base class / prototype for system services and let Shell inherit from it.
var TSOS;
(function (TSOS) {
    class Shell {
        constructor() {
            // Properties
            this.promptStr = ">";
            this.commandList = [];
            this.curses = "[fuvg],[cvff],[shpx],[phag],[pbpxfhpxre],[zbgureshpxre],[gvgf]";
            this.apologies = "[sorry]";
            this.printLen = new Map(); // used to store predetermined line accomodation amounts for each command
        }
        init() {
            if (sessionStorage.getItem("commOptionIndex")) { // resetting all of the session variables
                sessionStorage.removeItem("commOptionIndex");
                sessionStorage.removeItem("possOptions");
                sessionStorage.removeItem("baseString");
            }
            sessionStorage.removeItem("commHistory");
            sessionStorage.setItem("lCommInd", "0");
            var sc;
            //
            // Load the command list.
            // ver
            sc = new TSOS.ShellCommand(this.shellVer, "ver", "- Displays the current version data.");
            this.commandList[this.commandList.length] = sc;
            this.printLen.set("ver", 1); // setting the accomodation                                          
            // help
            sc = new TSOS.ShellCommand(this.shellHelp, "help", "- This is the help command. Seek help.");
            this.commandList[this.commandList.length] = sc;
            this.printLen.set("help", 15);
            // shutdown
            sc = new TSOS.ShellCommand(this.shellShutdown, "shutdown", "- Shuts down the virtual OS but leaves the underlying host / hardware simulation running.");
            this.commandList[this.commandList.length] = sc;
            this.printLen.set("shutdown", 1);
            // cls
            sc = new TSOS.ShellCommand(this.shellCls, "cls", "- Clears the screen and resets the cursor position.");
            this.commandList[this.commandList.length] = sc;
            this.printLen.set("cls", 0);
            // man <topic>
            sc = new TSOS.ShellCommand(this.shellMan, "man", "<topic> - Displays the MANual page for <topic>.");
            this.commandList[this.commandList.length] = sc;
            this.printLen.set("man", 1);
            // trace <on | off>
            sc = new TSOS.ShellCommand(this.shellTrace, "trace", "<on | off> - Turns the OS trace on or off.");
            this.commandList[this.commandList.length] = sc;
            this.printLen.set("trace", 1);
            // rot13 <string>
            sc = new TSOS.ShellCommand(this.shellRot13, "rot13", "<string> - Does rot13 obfuscation on <string>.");
            this.commandList[this.commandList.length] = sc;
            this.printLen.set("rot13", 1);
            // prompt <string>
            sc = new TSOS.ShellCommand(this.shellPrompt, "prompt", "<string> - Sets the prompt.");
            this.commandList[this.commandList.length] = sc;
            this.printLen.set("prompt", 1);
            // ps  - list the running processes and their IDs
            // kill <id> - kills the specified process id.
            // date command
            sc = new TSOS.ShellCommand(this.shellDate, "date", "- displays the current date and time.");
            this.commandList[this.commandList.length] = sc;
            this.printLen.set("date", 1);
            //whereami command
            sc = new TSOS.ShellCommand(this.shellAmI, "whereami", "-gives accurate information about a user's current position.");
            this.commandList[this.commandList.length] = sc;
            this.printLen.set("whereami", 1);
            //special command (ufo tracker, uncomment the window.open command in this method for a cool trick)
            sc = new TSOS.ShellCommand(this.shellUfoTracker, "whereistheufo", "- opens a google maps tab of the current location of the UFO");
            this.commandList[this.commandList.length] = sc;
            this.printLen.set("whereistheufo", 3);
            //status command
            sc = new TSOS.ShellCommand(this.shellStatus, "status", "-sets the status of the current session");
            this.commandList[this.commandList.length] = sc;
            this.printLen.set("status", 1);
            //load command
            sc = new TSOS.ShellCommand(this.shellLoadProg, "load", "-Loads the program code provided by the user");
            this.commandList[this.commandList.length] = sc;
            this.printLen.set("load", 1);
            // Display the initial prompt.
            this.putPrompt();
        }
        putPrompt() {
            _StdOut.putText(this.promptStr);
        }
        handleInput(buffer) {
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
            var index = 0;
            var found = false;
            var fn = undefined;
            while (!found && index < this.commandList.length) {
                if (this.commandList[index].command === cmd) {
                    found = true;
                    fn = this.commandList[index].func;
                }
                else {
                    ++index;
                }
            }
            if (found) {
                this.execute(fn, args); // Note that args is always supplied, though it might be empty.
            }
            else {
                // It's not found, so check for curses and apologies before declaring the command invalid.
                if (this.curses.indexOf("[" + TSOS.Utils.rot13(cmd) + "]") >= 0) { // Check for curses.
                    this.execute(this.shellCurse);
                }
                else if (this.apologies.indexOf("[" + cmd + "]") >= 0) { // Check for apologies.
                    this.execute(this.shellApology);
                }
                else { // It's just a bad command. {
                    this.execute(this.shellInvalidCommand);
                }
            }
        }
        // Note: args is an optional parameter, ergo the ? which allows TypeScript to understand that.
        execute(fn, args) {
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
        parseInput(buffer) {
            var retVal = new TSOS.UserCommand();
            // 1. Remove leading and trailing spaces.
            buffer = TSOS.Utils.trim(buffer);
            // 2. Lower-case it.
            // buffer = buffer.toLowerCase();
            // 3. Separate on spaces so we can determine the command and command-line args, if any.
            var tempList = buffer.split(" ");
            // 4. Take the first (zeroth) element and use that as the command.
            var cmd = tempList.shift().toLowerCase(); // Yes, you can do that to an array in JavaScript. See the Queue class.
            // 4.1 Remove any left-over spaces.
            cmd = TSOS.Utils.trim(cmd);
            // 4.2 Record it in the return value.
            retVal.command = cmd;
            // 5. Now create the args array from what's left.
            for (var i in tempList) {
                var arg = TSOS.Utils.trim(tempList[i]);
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
        shellInvalidCommand() {
            _StdOut.putText("Invalid Command. ");
            if (_SarcasticMode) {
                _StdOut.putText("Unbelievable. You, [subject name here],");
                _StdOut.advanceLine();
                _StdOut.putText("must be the pride of [subject hometown here].");
            }
            else {
                _StdOut.putText("Type 'help' for, well... help.");
            }
        }
        shellCurse() {
            _StdOut.putText("Oh, so that's how it's going to be, eh? Fine.");
            _StdOut.advanceLine();
            _StdOut.putText("Bitch.");
            _SarcasticMode = true;
        }
        shellApology() {
            if (_SarcasticMode) {
                _StdOut.putText("I think we can put our differences behind us.");
                _StdOut.advanceLine();
                _StdOut.putText("For science . . . You monster.");
                _SarcasticMode = false;
            }
            else {
                _StdOut.putText("For what?");
            }
        }
        // Although args is unused in some of these functions, it is always provided in the 
        // actual parameter list when this function is called, so I feel like we need it.
        shellVer(args) {
            _StdOut.putText(APP_NAME + " version " + APP_VERSION);
        }
        shellHelp(args) {
            _StdOut.putText("Commands:");
            for (var i in _OsShell.commandList) {
                _StdOut.advanceLine();
                _StdOut.putText("  " + _OsShell.commandList[i].command + " " + _OsShell.commandList[i].description);
            }
        }
        shellShutdown(args) {
            _StdOut.putText("Shutting down...");
            // Call Kernel shutdown routine.
            _Kernel.krnShutdown();
            // TODO: Stop the final prompt from being displayed. If possible. Not a high priority. (Damn OCD!)
        }
        shellCls(args) {
            _StdOut.clearScreen();
            _StdOut.resetXY();
        }
        shellMan(args) {
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
                    default:
                        _StdOut.putText("No manual entry for " + args[0] + ".");
                }
            }
            else {
                _StdOut.putText("Usage: man <topic>  Please supply a topic.");
            }
        }
        shellTrace(args) {
            if (args.length > 0) {
                var setting = args[0];
                switch (setting) {
                    case "on":
                        if (_Trace && _SarcasticMode) {
                            _StdOut.putText("Trace is already on, doofus.");
                        }
                        else {
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
            }
            else {
                _StdOut.putText("Usage: trace <on | off>");
            }
        }
        shellRot13(args) {
            if (args.length > 0) {
                // Requires Utils.ts for rot13() function.
                _StdOut.putText(args.join(' ') + " = '" + TSOS.Utils.rot13(args.join(' ')) + "'");
            }
            else {
                _StdOut.putText("Usage: rot13 <string>  Please supply a string.");
            }
        }
        shellPrompt(args) {
            if (args.length > 0) {
                _OsShell.promptStr = args[0];
            }
            else {
                _StdOut.putText("Usage: prompt <string>  Please supply a string.");
            }
        }
        // date command
        shellDate() {
            var today = new Date();
            var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            var daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            var date = daysOfWeek[today.getDay()] + " " + months[(today.getMonth())] + ' ' + today.getDate() + ", " + today.getFullYear(); //building the date portion
            var minutes = today.getMinutes() > 9 ? today.getMinutes() : "0" + today.getMinutes(); //building the time while taking into acount spacing
            var seconds = today.getSeconds() > 9 ? today.getSeconds() : "0" + today.getSeconds();
            var period = "AM";
            var hours = today.getHours();
            if (hours > 11) { // handling edge cases in times
                period = "PM";
                if (hours > 12) {
                    hours -= 12;
                }
            }
            if (hours == 0) {
                hours = 12;
            }
            var time = hours + ":" + minutes + ":" + seconds + " " + period;
            _StdOut.putText(`The current date and time is ${date} ${time}.`);
        }
        // simple little reminder of where you are
        shellAmI() {
            _StdOut.putText("Somewhere between where you were and where you are going to be.");
        }
        //"high tech" ufo tracker
        shellUfoTracker(version) {
            _StdOut.putText("Locating...");
            _StdOut.advanceLine();
            // _StdOut.putText("Please allow the popup to view the location of the UFO.");
            var x = (Math.random() * 360) - 180; // making random coordinates
            var y = (Math.random() * 360) - 180;
            // _StdOut.advanceLine();
            _StdOut.putText(`Found them hovering above the GPS coordinates ${x},${y}. `);
            if (version.length != 0) {
                window.open(`https://www.google.com/maps/@${x},${y},6.62z`);
            }
        }
        // status command for setting status
        shellStatus(status) {
            var stat = status.join(" ");
            document.getElementById("cStatus").innerHTML = stat; // talking directly to the DOM
            _StdOut.putText("Updated the status.");
            _StdOut.advanceLine();
        }
        //loading in the program code and checking it for valid hex
        shellLoadProg() {
            var inputtedCode = document.getElementById("taProgramInput").value; // casting necessary to get .value
            var strippedCode = inputtedCode.replace(/\s/g, ''); // removing spaces
            if (/^[A-F0-9]+$/i.test(strippedCode)) { // testing against a regex
                if (strippedCode.length <= 512) { //saving a computation by not dividing length by 2
                    var memList = [];
                    var memInd = 0;
                    while (memInd < strippedCode.length) {
                        memList[memList.length] = strippedCode.substring(memInd, (memInd + 2));
                        memInd += 3;
                    }
                    if (memList.length < 256) {
                        for (let i = memList.length; i < 256; i++) {
                            memList[i] = "00";
                        }
                    }
                    var cMemTable = document.getElementById("memTableRows").getElementsByTagName("tr");
                    var realMemInd = 0;
                    for (let i = 0; i < 32; i++) {
                        var tempRow = cMemTable[i];
                        tempRow[0].innerHTML = memList[realMemInd];
                        realMemInd++;
                        tempRow[1].innerHTML = memList[realMemInd];
                        realMemInd++;
                        tempRow[2].innerHTML = memList[realMemInd];
                        realMemInd++;
                        tempRow[3].innerHTML = memList[realMemInd];
                        realMemInd++;
                        tempRow[4].innerHTML = memList[realMemInd];
                        realMemInd++;
                        tempRow[5].innerHTML = memList[realMemInd];
                        realMemInd++;
                        tempRow[6].innerHTML = memList[realMemInd];
                        realMemInd++;
                        tempRow[7].innerHTML = memList[realMemInd];
                        document.getElementById("memTableRows").getElementsByTagName("tr")[i] = tempRow;
                        console.log("in here");
                    }
                    _StdOut.putText("File loaded. Machine code is valid hex of an acceptable length.");
                    _StdOut.advanceLine();
                }
                else {
                    _StdOut.putText("File could not be loaded. Machine code is valid hex, but program will not fit in memory.");
                    _StdOut.advanceLine();
                }
            }
            else {
                _StdOut.putText("File could not be loaded. Machine code is not in hexidecimal format.");
                _StdOut.advanceLine();
            }
        }
    }
    TSOS.Shell = Shell;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=shell.js.map
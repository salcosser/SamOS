/* ------------
     Console.ts

     The OS Console - stdIn and stdOut by default.
     Note: This is not the Shell. The Shell is the "command line interface" (CLI) or interpreter for this console.
     ------------ */

module TSOS {

    export class Console {

        constructor(public currentFont = _DefaultFontFamily,
                    public currentFontSize = _DefaultFontSize,
                    public currentXPosition = 0,
                    public currentYPosition = _DefaultFontSize,
                    public buffer = "",
                    ) {
        }

        public init(): void {
            this.clearScreen();
            this.resetXY();
        }

        public clearScreen(): void {
            _DrawingContext.clearRect(0, 0, _Canvas.width, _Canvas.height);
        }

        public resetXY(): void {
            this.currentXPosition = 0;
            this.currentYPosition =_DefaultFontSize;
            
        }
        /*****************************************/
        /*os.console.handleScroll                */
        /*purpose: handle display text overflow  */
        /*inputs: scrollLen - predetermined space*/
        /*accomodation for a given shell command */
        /*output: n/a                            */
        /*****************************************/
       




 

        public handleInput(): void {
            while (_KernelInputQueue.getSize() > 0) {

                



                // Get the next character from the kernel input queue.
                var chr = _KernelInputQueue.dequeue();
                // Check to see if it's "special" (enter or ctrl-c) or "normal" (anything else that the keyboard device driver gave us).

                
                if (chr === String.fromCharCode(13)) { // the Enter key
                   
                    
                    
                    // The enter key marks the end of a console command, so ...
                    // ... tell the shell ...
                   
                    _OsShell.handleInput(this.buffer);
                    

                    var cHist = sessionStorage.getItem("commHistory"); //recording this command so it can be recalled later
                    if(cHist){
                        var histList = JSON.parse(cHist);
                        histList[histList.length] = this.buffer;
                        var newHist = JSON.stringify(histList);
                        sessionStorage.setItem("commHistory", newHist);
                        sessionStorage.setItem("lCommInd", (histList.length-1).toString());
                       
                    }else{ // in case this is the first command
                        var nHist = [];
                        nHist[0] =  this.buffer;
                        sessionStorage.setItem("commHistory",JSON.stringify(nHist));
                    }
                    
                    this.buffer = "";
                    
                }else if(chr === String.fromCharCode(8) && this.buffer.length > 0){
                    //backspace
                    
                    this.backspace();
                    this.buffer = this.buffer.substr(0, this.buffer.length-1);
                    console.log(this.buffer);
                }else if(chr === String.fromCharCode(9)){ // using tab for autocomplete
                    
                    
                    var commandOptions = sessionStorage.getItem("possOptions");
                    var bString = sessionStorage.getItem("baseString");

                    if(commandOptions){ // if this is not the first time pressing tab
                       
                        var commandOptionsList = JSON.parse(commandOptions);
                       if(commandOptionsList.indexOf(this.buffer) === -1){  // if someone presses tab, types a letter, then presses tab again
                            sessionStorage.removeItem("commOptionIndex");
                            sessionStorage.removeItem("possOptions");
                            sessionStorage.removeItem("baseString");
                            continue;
                       } 
                        
                        
                        
                        var cIndex = parseInt(sessionStorage.getItem("commOptionIndex"));// to get to the right place in the list
                        if((cIndex+1)>=commandOptionsList.length){
                           cIndex = 0;
                          
                        }else{
                            cIndex++;
                        }
                        var cCommand = commandOptionsList[cIndex];
                        console.log(cCommand);
                        var delLen = this.buffer.length;
                        for(var n = 0;n<delLen - bString.length+1;n++){
                            this.backspace();
                            this.buffer = this.buffer.substr(0, this.buffer.length-1);
                        }
                        for(var i = bString.length-1;i<cCommand.length;i++){
                            _KernelInputQueue.enqueue(cCommand.charAt(i));
                        }
                        
                    
                        sessionStorage.setItem("commOptionIndex", (cIndex).toString());
                        

                    }else{ // if htis is the first tab
                        var possibleCommands = [];
                        for(var comm of _OsShell.commandList){
                            if(comm.command.substr(0, this.buffer.length) == this.buffer){  // looking for any commands that match
                                possibleCommands[possibleCommands.length] = comm.command;
                            }
                        }
                        if(possibleCommands.length === 0){
                            continue;
                        }
                        sessionStorage.setItem("possOptions", JSON.stringify(possibleCommands));
                        sessionStorage.setItem("commOptionIndex", "0");
                        sessionStorage.setItem("baseString", this.buffer);
                        for(var i = this.buffer.length;i<possibleCommands[0].length;i++){
                            _KernelInputQueue.enqueue(possibleCommands[0].charAt(i));
                        }
                    }
                
                
                
                }else if(chr === "UP"){ // up arrow
                    var bLen = this.buffer.length;
                   
                    var commInd = parseInt(sessionStorage.getItem("lCommInd"))
                    var commHistList = JSON.parse(sessionStorage.getItem("commHistory"));
                    
                    if(!commHistList){ // in case there is no command history
                        continue;
                    }
                    
                    var pulledComm = commHistList[commInd];

                    for(var i = 0;i< bLen;i++) {
                        this.backspace();
                        this.buffer = this.buffer.substr(0, this.buffer.length-1);
                    }
                    for(var i = 0; i< pulledComm.length; i++) {     //adding the rest of the command
                        _KernelInputQueue.enqueue(pulledComm.charAt(i));
                    }
                    if(commInd === 0) {                 //setting the index of the command for next time
                        sessionStorage.setItem("lCommInd", (commHistList.length-1).toString());
                    }else{
                        sessionStorage.setItem("lCommInd", `${--commInd}`);
                    }

                    
                }else if(chr === "DOWN"){
                    var bLen = this.buffer.length;
                   
                    var commInd = parseInt(sessionStorage.getItem("lCommInd"))
                    var commHistList = JSON.parse(sessionStorage.getItem("commHistory"));
                    
                    if(!commHistList){ // in case there is no command history
                        continue;
                    }
                    
                    var pulledComm = commHistList[commInd];

                    for(var i = 0;i< bLen;i++) {
                        this.backspace();
                        this.buffer = this.buffer.substr(0, this.buffer.length-1);
                    }
                    for(var i = 0; i< pulledComm.length; i++) {     //adding the rest of the command
                        _KernelInputQueue.enqueue(pulledComm.charAt(i));
                    }
                    if(commInd === commHistList.length-1) {                 //setting the index of the command for next time
                        sessionStorage.setItem("lCommInd", (0).toString());
                    }else{
                        sessionStorage.setItem("lCommInd", `${++commInd}`);
                    }  
                } else {
                    // This is a "normal" character, so ...
                    // ... draw it on the screen...
                    this.putText(chr);
                    // ... and add it to our buffer.
                    
                    this.buffer += chr;
                 
                  
                }
                // TODO: Add a case for Ctrl-C that would allow the user to break the current program.


               
            }
        }
        public formattedLine(text){
            var remLen = _Canvas.width - this.currentXPosition;
            var tempText = "";
            var formattedOut = [];
            while (text.length > 0) {
                
                while (  _DrawingContext.measureText(this.currentFont, this.currentFontSize, (tempText + text.charAt(0))) <= remLen && (text.length > 0) ) {
                    tempText += text.charAt(0);
                    text = text.slice(1);
                }
                formattedOut.push(tempText);
                tempText = "";
                remLen = _Canvas.width; 
            }
            return formattedOut;
        }
        public putText(text) {
              /*  My first inclination here was to write two functions: putChar() and putString().
                Then I remembered that JavaScript is (sadly) untyped and it won't differentiate
                between the two. (Although TypeScript would. But we're compiling to JavaScipt anyway.)
                So rather than be like PHP and write two (or more) functions that
                do the same thing, thereby encouraging confusion and decreasing readability, I
                decided to write one function and use the term "text" to connote string or char.
            */
            if (text !== "") {
                var formattedLine = this.formattedLine(text);
                for (var i = 0; i < formattedLine.length; i++) {
                    var cLine = formattedLine[i];
                    // Draw the text at the current X and Y coordinates.
                    _DrawingContext.drawText(this.currentFont, this.currentFontSize, this.currentXPosition, this.currentYPosition, cLine);
                    // Move the current X position.
                    var offset = _DrawingContext.measureText(this.currentFont, this.currentFontSize, cLine);
                    this.currentXPosition = this.currentXPosition + offset;
                    if (i + 1 < formattedLine.length) {
                        this.advanceLine();
                    }
                }
            }
        }
   
        /***********************************/
        /*os.console.backspace             */
        /*purpose: remove the last inputted*/
        /*character from the command line  */
        /*inputs: n/a                      */
        /*outputs: n/a                     */
        /***********************************/
        public backspace()  : void { //backspace
                
                var offset = _DrawingContext.measureText(this.currentFont, this.currentFontSize, this.buffer[this.buffer.length - 1]);
                
                this.currentXPosition -= offset;
                var yPos = this.currentYPosition - (this.currentFontSize - 1);
                var vertSize = _DefaultFontSize + 
                _DrawingContext.fontDescent(this.currentFont, this.currentFontSize) +
                _FontHeightMargin;
                _DrawingContext.clearRect(this.currentXPosition, yPos, offset, vertSize);
                
                
        }

        public advanceLine(): void {
            this.currentXPosition = 0;
            /*
             * Font size measures from the baseline to the highest point in the font.
             * Font descent measures from the baseline to the lowest point in the font.
             * Font height margin is extra spacing between the lines.
             */
            this.currentYPosition += _DefaultFontSize + 
                                     _DrawingContext.fontDescent(this.currentFont, this.currentFontSize) +
                                     _FontHeightMargin;

                                     this.currentXPosition = 0;
       
           
            if (this.currentYPosition > _Canvas.height) {
                
                var img = _DrawingContext.getImageData(0, 0, _Canvas.width, _Canvas.height);
               
                this.clearScreen();
                var imgOffset = -(_DefaultFontSize +
                    _DrawingContext.fontDescent(this.currentFont, this.currentFontSize) +
                    _FontHeightMargin);
                _DrawingContext.putImageData(img, 0, imgOffset);
                
                this.currentYPosition = _Canvas.height - this.currentFontSize;
            }
            // TODO: Handle scrolling. (iProject 1)

         // ^^^ found this todo marker and thought of how to improve scrolling 
        }
        /****************************/
        /*backTrackLine             */
        /*purpose:push up the y     */
        /*position of the console   */
        /*and reset x               */
        /*input: lineAmt : amount of*/
        /*lines to backtrack        */
        /*outputs: n/a              */
        /****************************/
        public backtrackLine(lineAmt): void {
            this.currentXPosition = 0;
            
            this.currentYPosition += -((_DefaultFontSize + 
                                     _DrawingContext.fontAscent(this.currentFont, this.currentFontSize) +
                                     _FontHeightMargin) * lineAmt);
            
        }

    }
 }

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
        public handleScroll(scrollLen: number): void{    
            
            console.log(scrollLen);
            const safeBottom = 487.0799999999998;                                                       //standard measurments used to calculate
            const fDSize = (_DrawingContext.fontDescent(this.currentFont, this.currentFontSize));       //scrolling distance
            const fASize = (_DrawingContext.fontAscent(this.currentFont, this.currentFontSize));

            const dcSize = _DefaultFontSize + 
            _DrawingContext.fontDescent(this.currentFont, this.currentFontSize) +
            _FontHeightMargin;



            if((scrollLen) == 0){              //some methods have no scrolling accomodation,
                return;                        //a zero value would break these calculations
            } 
            
            
                if(this.currentYPosition + (dcSize* scrollLen) > safeBottom){       //if the necessary scrolling accomodation would overflow over the canvas, 
                const img = _DrawingContext.getImageData(0, fDSize * scrollLen, _Canvas.width, _Canvas.height +  (fDSize * (scrollLen+1)));
                
                this.clearScreen();
                    if( ( (this.currentYPosition-((((dcSize* scrollLen) + (dcSize* 5))) )  <= 0  ))){// done in case the scrolling would be too much,
                    this.init();                                                                     // and it would be easier to just start from the top
                  
                    _DrawingContext.putImageData(img, 0, -(dcSize * 22));
                    this.resetXY();
                    
                   
                    console.log("reset all");
                }else{
                    _DrawingContext.putImageData(img, 0, ((dcSize* -((scrollLen)) - (dcSize* 4))));
                   
                    this.backtrackLine(scrollLen+2);
                   
                }
            
                
                

            }
           
        }




 

        public handleInput(): void {
            while (_KernelInputQueue.getSize() > 0) {

                



                // Get the next character from the kernel input queue.
                var chr = _KernelInputQueue.dequeue();
                // Check to see if it's "special" (enter or ctrl-c) or "normal" (anything else that the keyboard device driver gave us).

                
                if (chr === String.fromCharCode(13)) { // the Enter key
                   
                    
                    
                    // The enter key marks the end of a console command, so ...
                    // ... tell the shell ...
                    var comLen = _OsShell.printLen.get(this.buffer);    //getting the right scrolling accommodation, and accounting for it
                    if(this.buffer.length == 0){
                        this.handleScroll(1);
                    }else if(comLen != undefined){
                        this.handleScroll(comLen);
                    }else{
                        this.handleScroll(1);
                    }
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

        public putText(text): void {
            /*  My first inclination here was to write two functions: putChar() and putString().
                Then I remembered that JavaScript is (sadly) untyped and it won't differentiate
                between the two. (Although TypeScript would. But we're compiling to JavaScipt anyway.)
                So rather than be like PHP and write two (or more) functions that
                do the same thing, thereby encouraging confusion and decreasing readability, I
                decided to write one function and use the term "text" to connote string or char.
            */
            if (text !== "") {
                // Draw the text at the current X and Y coordinates.
                _DrawingContext.drawText(this.currentFont, this.currentFontSize, this.currentXPosition, this.currentYPosition, text);
                // Move the current X position.
                var offset = _DrawingContext.measureText(this.currentFont, this.currentFontSize, text);
                this.currentXPosition = this.currentXPosition + offset;
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
                _DrawingContext.clearRect(this.currentXPosition, yPos, offset, this.currentFontSize);
                
                
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

            // TODO: Handle scrolling. (iProject 1)
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

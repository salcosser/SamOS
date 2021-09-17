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
        public handleScroll(scrollLen: number): void{   
            
            console.log(scrollLen);
            const safeBottom = 487.0799999999998;
            var fDSize = (_DrawingContext.fontDescent(this.currentFont, this.currentFontSize));
            var fASize = (_DrawingContext.fontAscent(this.currentFont, this.currentFontSize));

            var dcSize = _DefaultFontSize + 
            _DrawingContext.fontDescent(this.currentFont, this.currentFontSize) +
            _FontHeightMargin;



            if((scrollLen) == 0){
                return;
            } 
            
            
                if(this.currentYPosition + (dcSize* scrollLen) > safeBottom){
                var img = _DrawingContext.getImageData(0, fDSize * scrollLen, _Canvas.width, _Canvas.height +  (fDSize * (scrollLen+1)));
                
                this.clearScreen();
                // if( ( (this.currentYPosition-((dcSize* (scrollLen+2)) + 2*(dcSize)+ this.currentFontSize) )  <= 0  )){
                    if( ( (this.currentYPosition-((((dcSize* scrollLen) + (dcSize* 5))) )  <= 0  ))){
                    this.init();
                  
                    _DrawingContext.putImageData(img, 0, -(dcSize * 22));
                    this.resetXY();
                    
                    // this.advanceLine();
                    // this.advanceLine();
                    // this.advanceLine();
                    console.log("reset all");
                }else{
                    _DrawingContext.putImageData(img, 0, ((dcSize* -((scrollLen)) - (dcSize* 4))));
                    // _DrawingContext.putImageData(img, 0, (fASize* -((scrollLen))) );
                    console.log("we tried");
                    this.backtrackLine(scrollLen+2);
                    console.log("everyting seems fine");
                }
            
                
                

            }else{
                console.log((this.currentYPosition+ ((fDSize * (scrollLen)) + (fDSize))) + " Seems fine.");
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
                    var comLen = _OsShell.printLen.get(this.buffer);
                    if(this.buffer.length == 0){
                        this.handleScroll(1);
                    }else if(comLen != undefined){
                        this.handleScroll(comLen);
                    }else{
                        this.handleScroll(1);
                    }
                    _OsShell.handleInput(this.buffer);
                    
                 
                    this.buffer = "";
                }else if(chr === String.fromCharCode(8) && this.buffer.length > 0){
                    //backspace
                    
                    this.backspace();
                    this.buffer = this.buffer.substr(0, this.buffer.length-1);
                    console.log(this.buffer);
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
        public backspace()  : void {
                
                var offset = _DrawingContext.measureText(this.currentFont, this.currentFontSize, this.buffer[this.buffer.length - 1]);
                // var lHeight = _DefaultFontSize + _DrawingContext.fontDescent(this.currentFont, this.currentFontSize);
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
        public backtrackLine(lineAmt): void {
            this.currentXPosition = 0;
            
            this.currentYPosition += -((_DefaultFontSize + 
                                     _DrawingContext.fontAscent(this.currentFont, this.currentFontSize) +
                                     _FontHeightMargin) * lineAmt);
            
        }

    }
 }

/* ----------------------------------
   DeviceDriverKeyboard.ts

   The Kernel Keyboard Device Driver.
   ---------------------------------- */

module TSOS {

    // Extends DeviceDriver
    export class DeviceDriverKeyboard extends DeviceDriver {

        constructor() {
            // Override the base method pointers.

            // The code below cannot run because "this" can only be
            // accessed after calling super.
            // super(this.krnKbdDriverEntry, this.krnKbdDispatchKeyPress);
            // So instead...
            super();
            this.driverEntry = this.krnKbdDriverEntry;
            this.isr = this.krnKbdDispatchKeyPress;
        }

        public krnKbdDriverEntry() {
            // Initialization routine for this, the kernel-mode Keyboard Device Driver.
            this.status = "loaded";
            // More?
        }

        public krnKbdDispatchKeyPress(params) {
            // Parse the params.  TODO: Check that the params are valid and osTrapError if not.
            var keyCode = params[0];
            var isShifted = params[1];
            var isCtrl = params[2];
            //map of the keycodes for symbols when the shift key is down
            var shiftedSpecialChars = {48: ')', 
                                      49: '!',
                                      50: '@',
                                      51: '#',
                                      52: '$',
                                      53:'%',
                                      54:'^',
                                      55: '&',
                                      56: '*',
                                      57: '(',
                                      192: '~',
                                      173: '_',
                                      61: '+',
                                      219: '{',
                                      221: '}',
                                      220: '|',
                                      59: ':',
                                      222: '"',
                                      188: '<',
                                      190: '>',
                                      191: '?'};
            //map of keycodes and symbols
            var specialChars = {192: '`',
                                173: '-',
                                61: '=',
                                219: '[',
                                221: ']',
                                220: '\\',
                                59: ';',
                                222: "'",
                                188 : ',',
                                190: '.',
                                191: '/'};
            
            _Kernel.krnTrace("Key code:" + keyCode + " shifted:" + isShifted);
           
            var chr = "";
            // Check to see if we even want to deal with the key that was pressed.
            
            if ((keyCode >= 65) && (keyCode <= 90)) { // letter


                if (isShifted === true) { 
                    chr = String.fromCharCode(keyCode); // Uppercase A-Z
                }else if(isCtrl && keyCode == 67){
                    _KernelInterruptQueue.enqueue(new Interrupt(KILL_PROC_IRQ, [_Scheduler.runningPID]));
                } else {
                    chr = String.fromCharCode(keyCode + 32); // Lowercase a-z
                }
                // TODO: Check for caps-lock and handle as shifted if so.
                _KernelInputQueue.enqueue(chr);
            }else if(keyCode in shiftedSpecialChars && isShifted === true){ // Shifted Special Chars
                _KernelInputQueue.enqueue(shiftedSpecialChars[keyCode]);
             } else if (((keyCode >= 48) && (keyCode <= 57)) ||   // digits
                        (keyCode == 32)                     ||   // space
                        (keyCode == 13)) {                       // enter
                chr = String.fromCharCode(keyCode);
                _KernelInputQueue.enqueue(chr);
            }else if(keyCode in specialChars){ // for special characters
               
                _KernelInputQueue.enqueue(specialChars[keyCode]);
            }
            
            else if(keyCode == 8){ //backspace
               
                chr = String.fromCharCode(8);
                _KernelInputQueue.enqueue(chr);
            }else if(keyCode == 9){ // tab key
                chr = String.fromCharCode(9);
                _KernelInputQueue.enqueue(chr);
            }else if(keyCode == 38 && !isShifted){ //up arrow
                chr = "UP"; // necessary to differentiate and force the correct action, even if not using the right key code
                _KernelInputQueue.enqueue(chr);
            }else if(keyCode == 40 ){
                chr = "DOWN";
                _KernelInputQueue.enqueue(chr);
            }
        }
    }
}

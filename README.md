2019 - 2021 Browser-based Operating System in TypeScript
========================================================

Documentation Specific to SamOS
===============================

For each project due, check the corresponding branch, for example, for <code>iProject1</code>, check the branch named <code>iProject1</code>.
<h3>Features Include:</h3>
<ul>
  <li>a basic CLI and CLI commands</li>
  <ul>
    <li>ls</li>
    <li>cat &lt;filename&gt; </li>
    <li>ps</li>
    <li><kbd>ctrl + c</kbd> to kill the running program</li>
    <li>ver</li>
    <li>kill / killall</li>
    <li>run &lt;pid&gt; / runall</li>
    <li>and more ...</li>
  </ul>
    
  <li>customizable status</li>
  <li>running user programs written in 6502(a) assembly</li>
  <li>multiprogramming support</li>
  <li>selectable CPU scheduling algorithms</li>
  <ul>
    <li>First Come, First Served</li>
    <li>Round Robin</li>
    <li>Non-Preemptive Priority</li>
  </ul>
  <li>User File Support</li>
  <li>Memory Swap Files</li>
 </ul>


version 1.0 available  in master branch
======================================



Setup TypeScript
================

1. Install the [npm](https://www.npmjs.org/) package manager if you don't already have it.
1. Run `npm install -g typescript` to get the TypeScript Compiler. (You probably need to do this as root.)

-- or -- 

1. [Download](https://www.typescriptlang.org/download) it from the TypeScript website.
2. Execute the intstaller.

Workflow
=============

Some IDEs (e.g., [Visual Studio Code](https://code.visualstudio.com), [IntelliJ IDEA](https://www.jetbrains.com/idea/), others) 
natively support TypeScript-to-JavaScript compilation and have tools for debugging, syntax highlighting, and more.
If your development environment lacks these then you'll have to compile your code from the command line, which is not a bad thing. 
(In fact, I kind of like that option.) Just make sure you configure `tsconfig.json` correctly and test it out.

A Few Notes
===========

**What's TypeScript?**
TypeScript is a language that allows you to write in a statically-typed language that outputs standard JavaScript.
It's all kinds of awesome.

**Why should I use it?**
This will be especially helpful for an OS or a Compiler that may need to run in the browser as you will have all of the great benefits of strong type checking and scope rules built right into your language.

**Where can I get more info on TypeScript**
[Right this way!](http://www.typescriptlang.org/)




How do I write programs for it? 
===============================
Go to https://www.labouseur.com/commondocs/6502alan-instruction-set.pdf where Dr. Alan Labouseur shows the full documentation for the subset of 6502 op codes that work on this OS.

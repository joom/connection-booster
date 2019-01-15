# connection-booster
Class project for COS561 with Prof. Jennifer Rexford: a Chrome app that calculates the optimal number of TCP parallel connections for maximum performance and loads in parallel.

## Abstract

As the user base around the world grows larger, improving browser performance is more critical than ever. We propose Connection Booster - an app that uses a formula based on our empirical observations to optimize the number of parallel TCP connections which the browser opens to acquire the resources on a page. In the following work, we describe the advantages and mostly disadvantages of the Chrome API in the implementation of our app, and explain the design decisions we made based on our findings about the Chrome API. We also analyze the empirical gains in terms of performance when using our app as opposed to the Google Chrome browser, and provide ideas for further improvements.

[Rest of the paper](https://github.com/joom/connection-booster/blob/master/paper.pdf)

# Installation

Clone the repo and open More Tools > Extensions in Google Chrome. Then click "Load Unpacked" on top left, and choose cloned repo folder. The app is now installed and you can see "Connection Booster" in the Chrome apps list.

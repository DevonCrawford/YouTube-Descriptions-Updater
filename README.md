# YouTube Descriptions Updater
Web server implementation of the YouTube Descriptions Updater. Users will be able to sign in with their youtube account and select videos to update. The descriptions can
be batch processed with six different string replacement functions suitable for link
replacement, entire section replacement and recovery files. The goal of this program
is to create as much automation as possible for YouTube creators :)

# Before you get started
Get familiar with the structure of my website. This project is an extension of
and will ultimately become integrated in my website so the proper conventions
must be followed as described in https://github.com/DevonCrawford/Personal-Website

# Get started
- Install node js on your machine
- cd to root directory, type "npm install" for dependencies
- type "npm run dev" to start the server
- Go to http://localhost:8082

## Main server file
youtube-updater.js

## Homepage HTML
views/pages/index.ejs

# TODO!
Choose any problem that you want to solve, fork it and name the branch after it.
I will review all pull requests and give feedback until the code can be integrated
into master.

## Security
Currently the app is not setup for concurrent users as the credentials are
stored in local memory. We must store the youtube api token inside of a session
in the users browser. Passport.js looks like a good library to assist
with this. http://www.passportjs.org/ I am still researching this and will likely
implement this ASAP

## String replacement (backend)
Six string replacement functions need to be written to update the descriptions.
When I am talking about a "section" I mean a grouped area of text that has no
new lines between it but has new lines around it. Such as this paragraph. The
title "String manipulation (backend)" would be the identifier of the section.

1) Input section Header (identifier). Only the title will be identified and the
section will be replaced in its entirety.
2) Input both section Header and Keys. Must have all the same keys inside of header
to be matched (ie key value pairs)
3) Grouping of tags replacement. Tags must be in a section (no space between,
    but space around) however we do not care about a title or identifier.
4) Multiple links independent from each other. If I were to simply enter a list
of links I want replaced it would replace the old ones with the new. This can be
used for links since they are unique enough to not conflict when searching
5) Extract sections out of upload defaults. Then update sections based on upload
defaults. Each youtube creator has an "upload defaults". The idea is that a creator
can set their upload defaults so new videos have updated links and then use this
software to extract the sections and update their old video descriptions automagically.
6) Recovery files (files must be named Video_Id.txt). Upload any number of these
recovery files and it will entirely replace the descriptions with the contents of
these text files.

## Recovery Files (backend)
Before any description is updated we want to create a recovery file in the
following structure:

- [YOUTUBE_USER_CHANNEL_ID : FOLDER]
    - [VIDEO_ID : FOLDER]
        - [DATE : FILE : YEAR/MONTH/DAY/HOUR/MINUTE/SECOND.TXT]
        - [DATE : FILE : YEAR/MONTH/DAY/HOUR/MINUTE/SECOND.TXT]
        - [DATE : FILE : YEAR/MONTH/DAY/HOUR/MINUTE/SECOND.TXT]
    - [VIDEO_ID]
    - [VIDEO_ID]
- [YOUTUBE_USER_CHANNEL_ID]
    - [VIDEO_ID]
    - [VIDEO_ID]
    - [VIDEO_ID]

In case of catastrophic events we want to have a backup of every description that
has ever been modified on the app. We also need a function for the user to download their own recovery files in case of a mistake. So we can use our replacement
function #6 to recover the descriptions.

# UI, Front End
1) We need a second table similar to the search results table. The user must be
able to select one of six string replacement functions (from a drop down) which
may then open more options as we require different input for each string replacement
function. See exactly what I mean in # String replacement. This second table
will display realtime results from the descriptions updater.. on success there
should be some green highlight or checkmark, on fail there should be some red
highlight or X. Use the same columns as the search table I have created except
add another column for "Status".

2) When a user clicks on a row of the table (of videos) it should construct a link
to take them to the youtube video manager page.

For example we have a VideoId = Gp6T2UscHwc

then our URL would be https://www.youtube.com/edit?o=U&video_id=Gp6T2UscHwc

3) We need user interfaces to interact with all of the functionaly described in
this TODO list... read through the entire document and I'm sure you will find many
things that still need to be done. Virtually every function I have described in
the backend (string replacement & recover files) will need user interfaces.

## Config (client_secret.json is invalid!)
If you are serious about developing this software and would like to sign
in with youtube and do testing please email me for the client_secret.json.
This contains the api connector information which is required for google to
allow usage of their api. Ultimately this will be placed in _config/client_secret.json
/*
*   Abricotine - Markdown Editor
*   Copyright (c) 2015 Thomas Brouard
*   Licensed under GNU-GPLv3 <http://www.gnu.org/licenses/gpl.html>
*/

var remote = require("electron").remote,
    constants = remote.require("./constants"),
    dialogs = remote.require("./dialogs.js"),
    files = remote.require("./files.js"),
    md2html = require.main.require("./md2html.js"),
    parsePath = require("parse-filepath"),
    pathModule = require("path"),
    userConfig = remote.require(constants.path.userConfig),
    Client = require('ftp');

function getDocTitle (data) {
    var firstLine = /^#+(.*)$/m,
        test = firstLine.exec(data),
        title = test !== null ? test[1].trim() : "Cozmic Group Proposal";
    return title;
}

function exportFtp (abrDoc, templateName, destPath, callback) {
    templateName = templateName || "default";
    // Get template path
    var templatePath = pathModule.join(constants.path.templatesDir, "/" + templateName);
    // Get editor content
    var markdown = abrDoc.getData();
    // Ask for destination path if undefined
    destPath = destPath || dialogs.askSavePath();
    if (!destPath || markdown.trim() === "") {
        return false;
    }
    // Append extension if none
    if (destPath.indexOf(".") === -1) {
        destPath += ".html";
    }

    // Copy images
    // TODO: should be an option
    // TODO: change img url in generated content
    // abrDoc.imageImport(destPath + "_files/images", false);

    // Markdown to HTML conversion
    var htmlContent = md2html(markdown);
    // Process and save HTML
    files.readFile(pathModule.join(templatePath, "/template.html"), function (template) {
        // Process templating
        var page = template.replace(/\$DOCUMENT_TITLE/g, getDocTitle(markdown))
                           .replace(/\$DOCUMENT_CONTENT/g, htmlContent)
        // Write output file

        var c = new Client();
        c.on('ready', function() {
            var fileFTP = destPath.split('/');
            var finalname = fileFTP[fileFTP.length-1];
            c.put(page, userConfig.ftp.ftpPath + finalname, function(err) {
              if (err) throw err;
              dialogs.ftpFileDone(finalname);
              c.end();
          });
        });
        c.connect({
            host: userConfig.ftp.host,
            user: userConfig.ftp.user,
            password: userConfig.ftp.password
        });

    });
}

module.exports = exportFtp;
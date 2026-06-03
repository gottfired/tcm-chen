let marked = require('marked');
let Promise = require('bluebird');
let nodeFs = require('fs');
let fs = Promise.promisifyAll(nodeFs);
let pages = require("./pages");
let path = require("path");
let util = require('util');


function destFileNameForPage(page) {
    let dest = page.dest;
    if (dest == null) {
        let ext = path.extname(page.src);
        dest = path.basename(page.src, ext) + ".html";
    }

    return dest;
}


function createNavbar(pages, page) {
    let navbar = '<ul class="nav-list">\n';
    pages.forEach((entry) => {
        let cssClass = entry.title === page.title ? "active" : "";
        let dest = destFileNameForPage(entry);
        navbar += '  <li class="' + cssClass + '"><a href="' + dest + '">' + entry.title + '</a></li>\n';
    });
    navbar += '</ul>';
    return navbar;
}


function createSlideshow(page) {
    console.log("Slideshow for " + JSON.stringify(page));

    let ret = "";
    if (page.images.length > 1) {
        ret = '<div class="slideshow">\n';
        page.images.forEach((image, index) => {
            let activeClass = index === 0 ? " active" : "";
            ret += `  <div class="slide${activeClass}"><img src="assets/${image}" alt="Slide ${index + 1}"></div>\n`;
        });
        ret += '</div>';
    } else {
        ret = '<div class="single-image"><img src="assets/' + page.images[0] + '" alt="' + page.title + '" class="img-responsive"/></div>';
    }

    return ret;
}


// Creates and writes a single html file
function createHtml(template, page, markdown) {
    // md to html
    let compiled = marked(markdown);

    // Replace title and content
    let output = template.replace("#{post.content}", compiled)
        .replaceAll("#{post.title}", page.title);

    // Replace all instances of #{navbar}
    let navbar = createNavbar(pages, page);
    output = output.replace(/#{navbar}/g, navbar);

    // Create the slideshow
    let slideshow = createSlideshow(page);
    output = output.replace("#{post.slideshow}", slideshow);

    // Create dest file name
    let dest = destFileNameForPage(page);

    console.log("Converting " + page.src + " to " + dest);

    // Write final output
    fs.writeFile("docs/" + dest, output, (error) => {
        if (error) {
            console.log(error);
        }
    });
}


function convert() {
    fs.readFileAsync("docs/template.html", "utf-8")
        .then(template => {
            pages.forEach(page => {
                fs.readFileAsync("pages/" + page.src, "utf-8")
                    .then(markdown => {
                        createHtml(template, page, markdown);
                    })
                    .catch((err) => {
                        console.log(err);
                    });
            })
        })
        .catch((err) => {
            console.log(err);
        });
}



convert();



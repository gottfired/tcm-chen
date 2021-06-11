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


function createDesktopNavbar(pages, page) {
    let navbar = "";
    pages.forEach((entry) => {
        let cssClass = entry.title === page.title ? "navigation_current" : "navigation";
        let dest = destFileNameForPage(entry);
        let line = '<a class ="' + cssClass + '" href="'
            + destFileNameForPage(entry) + '">'
            + entry.title + '</a> |\n';
        navbar += line;
    });

    // Remove last | character
    navbar = navbar.slice(0, -2);

    return navbar;
}


function createMobileNavbar(pages, page) {
    let navbar = "";
    pages.forEach((entry) => {
        let cssClass = entry.title === page.title ? ' class="active"' : '';
        let dest = destFileNameForPage(entry);
        let line = '<li' + cssClass + '><a href="'
            + destFileNameForPage(entry) + '">'
            + entry.title + '</a></li>\n';
        navbar += line;
    });

    return navbar;
}


function createSlideshow(page) {
    console.log("Slideshow for " + JSON.stringify(page));

    let ret = "";
    if (page.images.length > 1) {
        // data-rider="carousel" starts the slideshow
        // data-interval is the time between slides in ms
        // data-pause="" prevents pausing on "hover"
        ret = '<div id="myCarousel" \
                    class="carousel slide carousel-fade" \
                    data-ride="carousel" \
                    data-interval="4000" \
                    data-pause="" \
                    > \n\
                    <div class="carousel-inner" role="listbox">\n';

        page.images.forEach((image, index) => {
            let entry = util.format('<div class="item %s"><img src="assets/%s" alt="image_%d"></div>\n',
                index == 0 ? "active" : "", image, index);
            ret += entry;
        });

        ret += '</div>\n</div>';

    } else {
        ret = '<img src="assets/' + page.images[0] + '" alt="placeholder 960" class="img-responsive center-block"/>';
    }

    return ret;
}


// Creates and writes a single html file
function createHtml(template, page, markdown) {
    // md to html
    let compiled = marked(markdown);

    // Replace title and content
    let output = template.replace("#{post.content}", compiled)
        .replace("#{post.title}", page.title);

    // Replace desktop navbar
    let navbarDesktop = createDesktopNavbar(pages, page);
    output = output.replace("#{navbarDesktop}", navbarDesktop);

    // Replace mobile navbar
    let navbarMobile = createMobileNavbar(pages, page);
    output = output.replace("#{navbarMobile}", navbarMobile);

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



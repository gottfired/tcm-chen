let marked = require('marked');
let fs = require('fs/promises');
let pages = require("./pages");
let path = require("path");


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
        if (entry.inNavbar === false) {
            return;
        }
        let cssClass = entry.title === page.title ? "active" : "";
        let dest = destFileNameForPage(entry);
        navbar += '  <li class="' + cssClass + '"><a href="' + dest + '">' + entry.title + '</a></li>\n';
    });
    navbar += '</ul>';
    return navbar;
}


function createSlideshow(page) {
    console.log("Slideshow for " + JSON.stringify(page));

    if (page.map) {
        return '<div class="map-embed">'
            + '<iframe src="https://www.google.com/maps?q=Schwartzstra%C3%9Fe%207%2FHaus%207%2C%202500%20Baden%2C%20%C3%96sterreich&z=16&output=embed" '
            + 'title="Standortkarte Schwartzstraße 7/Haus 7, 2500 Baden" style="border:0;" '
            + 'allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>'
            + '</div>';
    }

    let ret = "";
    if (!page.images || page.images.length === 0) {
        return ret;
    }
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
async function createHtml(template, page, markdown) {
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

    try {
        await fs.writeFile("docs/" + dest, output);
    } catch (error) {
        console.log(error);
    }
}


async function convert() {
    try {
        let template = await fs.readFile("docs/template.html", "utf-8");

        for (const page of pages) {
            try {
                let markdown = await fs.readFile("pages/" + page.src, "utf-8");
                await createHtml(template, page, markdown);
            } catch (err) {
                console.log(err);
            }
        }
    } catch (err) {
        console.log(err);
    }
}



convert();



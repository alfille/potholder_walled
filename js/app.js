/* Potholder project
 * Ceramic production database application
 * See https://github.com/alfille/potholder
 * or https://alfille.online
 * by Paul H Alfille 2024
 * MIT license
 * */

/* jshint esversion: 11 */

export {
    PotImages,
} ;

import {
    PotData,
    PotDataReadonly,
    PotDataEditMode,
    SettingsData,
    DatabaseData,
    PotNewData,
    PotDataPrint,
    crop,
} from "./doc_data.js" ;

const structGeneralPot = [
    {
        name:  "type",
        alias: "Form",
        hint:  "Form of the piece",
        type:  "list",
        choices:  ["bowl","plate","flowerpot"],
        query: "qType",
    },
    {
        name:  "series",
        alias: "Series",    
        hint:  "Which creative wave?",
        type:  "list",
        query: "qSeries",
    },
    {
        name:  "start_date",
        alias: "Start date",
        type:  "date",
        hint:  "Date work started",
    },
    {
        name:  "artist",
        alias: "Artist",
        hint:  "Creator of this piece",
        type:  "list",
        query: "qArtist",
    },
    {
        name:  "general_comment",
        alias: "General comments",
        hint:  "Overall comments on piece",
        type:  "textarea",
    },
    {
        name:  "stage",
        alias: "Stage",
        hint:  "Stage of creation",
        type:  "radio",
        choices: ["greenware","bisqued","kiln","finished"],
    },
    {
        name:  "kiln",
        alias: "Kiln",
        hint:  "Kiln firing type",
        type:  "radio",
//        choices: ["greenware","bisque","oxidation","reduction","soda","raku","garbage","salt"],
        choices: ["none","oxidation","reduction","soda","raku",],
    },
    {
        name:  "weight_start",
        alias: "Starting weight",
        hint:  "Weight (in pounds) of the raw clay",
        type:  "text",
    },
    {
        name:  "construction",
        hint:  "techniques",
        type:  "checkbox",
        choices: ["wheel","slab","handbuilt","coil","pinch"],
    },
    {
        name:  "clay",
        alias: "Clay",
        hint:  "Clays used in piece",
        type:  "checkbox",
        choices: ["B-mix","Brown","Black","Brooklyn Red","Porcelain","Other"],
    },
    {
        name:  "clay_comment",
        alias: "Clay notes",
        hint:  "Comments on the clays",
        type:  "textarea",
    },
    {
        name:  "glaze",
        alias: "Glazes",
        type:  "array",
        members: [
            {
                name:  "type",
                alias: "Glaze",
                type:  "list",
                query: "qGlaze",
            },
            {
                name:  "comment",
                alias: "Notes",
                type:  "textarea",
            }
        ],
    },
    {
        name:  "weight_end",
        alias: "Final weight",
        hint:  "Weight (in pound) of the finished piece",
        type:  "text",
    },
    {
        name:  "location",
        hint:  "Current location",
        type:  "list",
        query: "qLocation",
    },
];

const structImages = [
    {
        name:  "images",
        alias: "Images",
        type:  "image_array",
        members: [
            {
                name:  "image",
                type:  "image",
            },
            {
                name:  "comment",
                alias: "Notes",
                hint:  "Notes about this photo",
                type:  "textarea",
            },
            {
                name:  "date",
                type:  "date",
                alias: "Date",
                hint:  "Date photo was taken",
            },
            {
                name:  "crop",
                type:  "crop",
            },
        ]
    }
];

globalThis.structData = {
    Data: structGeneralPot,
    Images: structImages,
};
        
globalThis.structDatabaseInfo = [
    {
        name:  "db_name",
        alias: "Database name",
        hint:  "Name of underlying database",
        type:  "text",
    },
    {
        name:  "doc_count",
        alias: "Document count",
        hint:  "Total number of undeleted documents",
        type:  "number",
    },
    {
        name:  "update_seq",
        hint:  "Sequence number",
        type:  "number",
    },
    {
        name:  "adapter",
        alias: "Database adapter",
        hint:  "Actual database type used",
        type:  "text",
    },
    {
        name:  "auto_compaction",
        alias: "Automatic compaction",
        hint:  "Database compaction done automatically?",
        type:  "text",
    },
];

globalThis.structSettings = [
    {
        name: "console",
        alias: "Console",
        hint: "Output errors to developer console (for debugging)",
        type: "bool",
    },
    {
        name: "img_format",
        alias: "Thumbnail format",
        hint: "Image encoding of thumbnail images",
        type: "radio",
        choices: ["png","jpeg","webp"],
    },
    {
        name: "fullscreen",
        alias: "Display full screen",
        hint: "Hide browser menu choices",
        type: "radio",
        choices: ["never","big_picture","always"],
    }
] ;

// Request persistent storage early
if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().then(granted => {
        if (granted) {
            console.log("[Storage] Storage quota expanded to persistent mode.");
        } else {
            console.warn("[Storage] Storage remains in default/best-effort mode.");
        }
    });
}

// singleton class instances
//globalThis. globalAddress  = null ;
//globalThis. crop  = null ;
globalThis. globalPotData  = null ;

globalThis. rightSize = ( imgW, imgH, limitW, limitH ) => {
    const h = limitW * imgH / imgW ;
    if ( h <= limitH ) {
        return [ limitW, h ] ;
    } else {
        return [ limitH * imgW / imgH, limitH ] ;
    }
} ;

globalThis. cloneClass = ( fromClass, target ) => {
    document.getElementById("templates").
    querySelector(fromClass)
        .childNodes
        .forEach( cc => target.appendChild(cc.cloneNode(true) ) );
} ;

export class Pot { // convenience class
    constructor() {
        this.id = null ;
        this.pictureSource = document.getElementById("HiddenPix");
    }
    
    create() {
        // create new pot record
        return ({
            _id: Id_pot.makeId( this.doc ),
            type:"",
            series:"",
            author: database.username,
            artist: database.username,
            start_date: (new Date()).toISOString().split("T")[0],
            stage: "greenware",
            kiln: "none",
           });
    }
   
    del() {
        if ( this.isSelected() ) {        
            database.db.get( this.id )
            .then( (doc) => {
                // Confirm question
                if (confirm(`WARNING -- about to delete this piece\n piece type << ${doc?.type} >> of series << ${doc.series} >>\nPress CANCEL to back out`)==true) {
                    return database.db.remove(doc) ;
                } else {
                    throw "Cancel";
                }           
            })
            .then( _ => thumbs.remove( this.id ) )
            .then( _ => this.unselect() )
            .then( _ => page.show( "back" ) )
            .catch( (err) => {
                if (err != "Cancel" ) {
                    log.err(err);
                    page.show( "back" ) ;
                }
            });
        }
    }

    getAllIdDoc() {
        const doc = {
            startkey: Id_pot.allStart(),
            endkey:   Id_pot.allEnd(),
            include_docs: true,
            attachments: false,
        };
        return database.db.allDocs(doc);
    }
        
    select( pid ) {
        this.id = pid ;
        // Check pot existence
        new TextBox("Piece Selected");
    }

    isSelected() {
        return ( this.id != null ) ;
    }

    unselect() {
        this.id = null;
        new BlankBox();
    }

    pushPixButton() {
        this.pictureSource = document.getElementById("HiddenPix");
        this.pictureSource.click() ;
    }

    pushGalleryButton() {
        this.pictureSource=document.getElementById("HiddenGallery");
        this.pictureSource.click() ;
    }

    save_pic( pid=this.id, i_list=[] ) {
        if ( i_list.length == 0 ) {
            return Promise.resolve(true) ;
        }
        const f = i_list.pop() ;
        return database.db.get( pid )
        .then( doc => {
            if ( !("images" in doc ) ) {
                doc.images = [] ;
            }
            if ( doc.images.find( e => e.image == f.name ) ) {
                // exists, just update attachment
                return database.db.putAttachment( pid, f.name, doc._rev, f, f.type )
                    .catch( err => log.err(err)) ;
            } else {
                // doesn't exist, add images entry as well (to front)
                doc.images.unshift( {
                    image: f.name,
                    comment: "",
                    date: (f?.lastModifiedDate ?? (new Date())).toISOString(),
                    } );
                return database.db.put( doc )
                    .then( r => database.db.putAttachment( r.id, f.name, r.rev, f, f.type ) ) ;
            }
            })
        .then( _ => this.save_pic( pid, i_list ) ) ; // recursive
    }
                  

    newPhoto() {
        if ( ! pot.isSelected() ) { 
            page.show("AssignPic") ;
            return ;
        }
        const i_list = [...this.pictureSource.files] ;
        if (i_list.length==0 ) {
            return ;
        }
        
        const pid = this.id
        page.show("PotPixLoading");

        this.save_pic( pid, i_list )
        .then( () => thumbs.getOne( pid ) )
        .then( () => page.add( "PotMenu" ) )
        .then( () => page.show("PotPix") )
        .catch( (err) => {
            log.err(err);
            })
        .finally( () => this.pictureSource.value = "" ) ;
    }
    
    AssignToNew() {
        const doc = this.create() ;
        //console.log("new",doc);
        database.db.put( doc )
        .then( response => this.AssignPhoto( response.id ) )
        .catch( err => {
            log.err(err);
            page.show('MainMenu');
        }) ;
    }
            
    AssignPhoto(pid = this.id) {
        const i_list = [...this.pictureSource.files] ;
        if (i_list.length==0 ) {
            return ;
        }
        page.show("PotPixLoading");
        pot.select( pid ) ;
        this.save_pic( pid, i_list )
        .then( _ => thumbs.getOne( pid ) )
        .then( _ => page.add("PotMenu" ) )
        .then( _ => page.show("PotPix") )
        .catch( (err) => {
            log.err(err);
            })
        .finally( () => this.pictureSource.value = "" ) ;
    }
    
    showPictures(doc) {
        // doc alreaady loaded
        const bottom = document.getElementById("Bottom");
        const images = new PotImages(doc);
        bottom.innerHTML="";
        bottom.onclick=null;
        images.displayAll().forEach( i => bottom.appendChild(i) ) ;
    }
}

export const pot = new Pot() ;

class Id_pot {
    static type = "p";
    static version = 0;
    static start="";
    static end="\uffff";
    
    static splitId( id=pot.id ) {
        if ( id ) {
            const spl = id.split(";");
            return {
                version: spl[0] ?? null, // 0 so far
                type:    spl[1] ?? null,
                artist:  spl[2] ?? null,
                date:    spl[3] ?? null,
                rand:    spl[4] ?? null, // really creation date
            };
        }
        return null;
    }
    
    static joinId( obj ) {
        return [
            obj.version,
            obj.type,
            obj.artist,
            obj.date,
            obj.rand
            ].join(";");
    }
    
    static makeId( doc ) {
        return [
            this.version,
            this.type,
            database.username,
            new Date().toISOString(),
            Math.floor( Math.random() * 1000 ),
            ].join(";");
    }
    
    static allStart() { // Search entire database
        return [this.version, this.type, this.start].join(";");
    }
    
    static allEnd() { // Search entire database
        return [this.version, this.type, this.end].join(";");
    }
}

export class DatabaseManager { // convenience class
    // Access to remote (cloud) version of database
    constructor() {
        this.AUTH_STATUS_TIMEOUT_MS = 20000 ; //20 seconds
        
        // login_name
        this.username = null ;

        //this.database = null ;
        this.local    = null ;
        
        this._remoteDB = null;
        this._problem = false ; // separates real connection problem from just network offline
        this.synctext = document.getElementById("syncstatus");
        this.db = null ;
        
    }
    
    acquire_and_listen() {    
        // set up monitoring
        window.addEventListener("offline", _ => this.not_present() );
        window.addEventListener("online", _ => this.present() );

        // initial status
        if (navigator.onLine) {
            this.present() ;
        } else {
            this.not_present() ;
        }
    }
    
    open() { // local
        const local_db_name = address.database ?? "" ;
        if ( local_db_name !== "" ) {
            // open local copy
            this.db = new PouchDB( local_db_name, {auto_compaction: true} ) ; 
        }
    }

    // reset authelia authorization
    checkAuth() {
        if ( !navigator.onLine ) {
            console.log("navigator.onLine",navigator.onLine);
            return Promise.resolve({status: 'offline'}) ;
        }
        //console.log("/auth-status");  
        return fetch('/auth-status', {
            method: 'GET',
            credentials: 'include',
            redirect: 'manual',
            signal: AbortSignal.timeout(this.AUTH_STATUS_TIMEOUT_MS),
            })
        .then( result => {
            if ( result.status === 200 || result.status === 204 ) {
                if (this.username === null) {
                    return fetch("/api/me", { credentials: 'include' })
                    .then(api_res => {
                        if (!api_res.ok) {
                            throw new Error("Name failed " + api_res.status);
                        }
                        return api_res.json();
                        })
                    .then(user => {
                        this.username = user.name;
                        document.getElementById("userstatus").value = this.username;
                        return { status: 'authenticated' };
                        });
                }
                return {status:'authenticated'};
            } else {
                return {status: 'unauthenticated'} ;
            }
            })
        .catch( err => {
            console.log("auth failure",err);
            if (err.name === 'TimeoutError') {
                // request hung past the timeout — server/host unreachable,
                // slow/broken network, or a routing black hole
                return { status: 'unreachable', error: err };
            }
            if (err.name === 'AbortError') {
                // aborted for a different reason (rare here, since we control the signal)
                return { status: 'unknown', error: err };
            }
            // TypeError — could be DNS failure, connection refused, no network,
            // or a blocked cross-origin redirect. Browsers do not expose which.
            return { status: 'network-error', error: err };
            });    
    }
        
    present() {
        this.status( "good", "--network present--" ) ;
    }

    not_present() {
        this.status( "disconnect", "--network offline--" ) ;
    }
    
    reset_page() {
        //console.log("RESET PAGE -- won't for testing: ",globalAddress.get_auth().href);
        // trigger a call to authelia sig-in and then restart this app -- will need to save some state
        window.location.href = address.get_auth().href ;
    }

    // Initialise a sync process with the remote server
    foreverSync() {
        if ( this.local==true ) { // local -- no sync
            console.log("local");
            this.status("good","Local database only (no replication)");
            return ;
        }
        this.checkAuth().then( auth_res => {
            console.log("auth",auth_res);
            if (auth_res.status === 'unauthenticated') {
                this.reset_page();
                return;
            }
            if (auth_res.status !== 'authenticated') {
                // offline/unreachable/network-error — don't attempt sync this cycle
                this.status("problem", `Not syncing: ${auth_res.status}`);
                return;
            }
            
            // open remote database
            this._remoteDB = new PouchDB( address.database_url.href, {
                "skip_setup": "true",
                fetch: (url, opts) => {
                    opts.credentials = 'include';
                    opts.redirect = 'manual';
                    return PouchDB.fetch(url, opts).then( fetch_res => {
                        if (fetch_res.status === 401) {
                            this.checkAuth().then( auth_res => {
                                if (auth_res.status === 'unauthenticated') {
                                    this.reset_page();
                                }
                            });
                        }
                        return fetch_res; // still return it — let PouchDB's own error handling proceed too
                    });
                }
            });
            
            // start replication to match data local and remote            
            if ( this._remoteDB ) {
                this.get_remote_data()
                .then( info => this.status( "good", "Initial download finished" ) )
                .catch( (err) => this.status("problem",`Replication from remote error ${err.message}`) )
                .finally( _ => this.syncer() );
            } else {
                this.status("problem","No remote database specified!");
            }
        }) ;
    }
    
    // initial replication to get data remote -> local
    get_remote_data() {
        return new Promise((resolve, reject) => {
            this.status("good", "Starting replication");

            this.db.replicate.from(this._remoteDB, {
                live: false,
                retry: true,
                batch_size: 10,
            })
            .on('change', (info) => {
                TitleBox.flash();
                this.status("good", `Replication progress: ${info.docs_written} docs transferred`);
            })
            .on('complete', (info) => {
                TitleBox.flash();
                this.status("good", `Replication complete (${info.docs_written} docs imported)`);
                resolve(info);
            })
            .on('error', (err) => {
                this.status("bad", `Replication failed: ${err.message || err}`);
                reject(err);
            });
        });
    }      

    // continuous bidirectional local <-> remote
    syncer() {
        this.status("good","Starting database intermittent sync");
        database.db.sync( this._remoteDB ,
            {
                live: true,
                retry: true,
                filter: (doc) => doc._id.indexOf('_design') !== 0,
            } )
            .on('change', ()       => { TitleBox.flash() ; this.status( "good", "changed" ); })
            .on('paused', ()       => this.status( "good", "quiescent" ))
            .on('active', ()       => this.status( "good", "actively syncing" ))
            .on('denied', ()       => this.status( "problem", "Credentials or database incorrect" ))
            .on('complete', ()     => this.status( "good", "sync stopped" ))
            .on('error', (err)     => this.status( "problem", `Sync problem: ${err.reason}` ));
    }
    
    status( state, msg ) {
        switch (state) {
            case "disconnect":
                document.body.style.background="#7071d3"; // Orange
                if ( this.lastState !== state ) {
                    log.err(msg,"Network status");
                }
                break ;
            case "problem":
                document.body.style.background="#d72e18"; // grey
                log.err(msg,"Network status");
                this._problem = true ;
                break ;
            case "good":
            default:
                document.body.style.background="#172bae"; // happy blue
                if ( this.lastState !== state ) {
                    log.err(msg,"Network status");
                }
                this._problem = false ;
                break ;
        }
        this.synctext.value = msg ;
    }
    
    status_msg( msg ) {
        log.err(msg,"Information");
        this.synctext.value = msg ;
    }
            
    // Fauxton link
    fauxton() {
        window.open( `${address.get_fauxton()}`, '_blank' );
    }
    
    clearLocal() {
        const remove = confirm("Remove the data from this device?\nThe central database will not be affected.") ;
        if ( remove ) {
            storage.clear();
            // clear (local) database
            database.db.destroy()
            .finally( _ => location.reload() ); // force reload
        } else {
            page.show( "MainMenu" );
        }
    }

}

export const database = new DatabaseManager() ;
globalThis.database = database ; // for clearLocal in index.html

export class CSV { // convenience class
    constructor() {
        this.columns = [
            "type", "series", "location", "start_date", "artist", "firing", "weight_start","weight_end", "construction", "clay.type", "glaze.type", "kiln"
            ] ;
            
    }
    
    run() {
        this.make_table() ;
    }
    
    download( csv ) {
//        const filename = `${globalAddress.database}.csv` ;
        const filename = `${address.database}.csv` ;
        const htype = "text/csv" ;
        //htype the file type i.e. text/csv
        const blub = new Blob([csv], {type: htype});
        const link = document.createElement("a");
        link.download = filename;
        link.href = window.URL.createObjectURL(blub);
        link.style.display = "none";

        document.body.appendChild(link);
        link.click(); // press invisible button
        
        // clean up
        // Add "delay" see: https://www.stefanjudis.com/snippets/how-trigger-file-downloads-with-javascript/
        setTimeout( () => {
            window.URL.revokeObjectURL(link.href) ;
            document.body.removeChild(link) ;
        });
    }

    make_headings() {
        return this.make_row( this.columns.map( c => c.split(".")[0] ) ) ;
    } 

    get_text( combined_field, doc ) {
        const com = combined_field.split(".") ;
        switch (com.length) {
            case 0:
                return "" ;
            case 1:
                if ( com[0] in doc ) {
                    return doc[com[0]] ;
                }
                return "" ;

            case 2:
                if ( com[0] in doc ) {
                    return doc[com[0]].map( s => s[com[1]] ).join(", ") ;
                }
                return "" ;

        }
    } 

    make_row( row ) {
        return row
        .map( r => (isNaN(r) || (r=="")) ? `"${r}"` : r )
        .join(",");
    }
    
    make_table() {
        pot.getAllIdDoc()
        .then( docs => docs.rows.map( r => this.make_row( this.columns.map( c => this.get_text( c, r.doc ) ) ) ) )
        .then( data => data.join("\n") )
        .then( data => [this.make_headings(), data].join("\n") )
        .then( csv => this.download( csv ) )
        .catch( err => log.err(err) ) ;
    }
}
export const csv = new CSV() ;
globalThis.csv = csv ; // to access in index.html

export class Log{
    // Logs errors and shows error page
    // unfortunately hides offending line
    constructor() {
        this.list = [];
    }
    
    err( err, title=null ) {
        // generic console.log of error
        const ttl = title ?? page.current() ;
        const msg = err.message ?? err ;
        this.list.push(`${ttl}: ${msg}`);
        if ( settings?.console == "true" ) {
            console.group() ;
            console.log( ttl, msg ) ;
            console.trace();
            console.groupEnd();
        }
        if ( page.current() == "ErrorLog" ) {
            // update
            this.show();
        }
    }
    
    clear() {
        this.list = ["Error log cleared"] ;
        this.show();
    }
    
    show() {
        const cont = document.getElementById("ErrorLogContent") ;
        cont.innerHTML="";
        const ul = document.createElement('ul');
        cont.appendChild(ul);
        this.list
        .forEach( e => {
            const l = document.createElement('li');
            l.innerText=e;
            //l.appendChild( document.createTextNode(e) ) ;
            ul.appendChild(l) ;
        });
    }
}
export const log = new Log() ;
globalThis.log = log ;

class Pagelist {
    // list of subclasses = displayed "pages"
    static pages = {} ;
    
    constructor() {
        Pagelist.pages[this.constructor.name] = this ;
    }

    show_page(name, detail=null) {
        // console.log("showpage",name,detail);
        // reset buttons from edit mode
        document.querySelector(".potDataEdit").style.display="none"; 
        document.querySelectorAll(".topButtons")
            .forEach( tb => tb.style.display = "block" );

        // hide all but current page
        document.querySelectorAll(".pageOverlay")
            .forEach( po => po.style.display = po.classList.contains(name) ? "block" : "none" );

        // hide Thumbnails
        thumbs.hide() ;
        
        // hide Crop
        document.getElementById("crop_page").style.display="none" ;
        
        this.show_content(detail);
    }
    
    show_content() {
        // default version, derived classes may overrule
        // Simple menu page
    }
}

new class Help extends Pagelist {
    show_content() {
        window.open( new URL(`https://alfille.github.io/potholder`,location.href).toString(), '_blank' );
        page.show("back");
    }
}() ;

class PagelistThumblist extends Pagelist {
    show_content() {
        thumbs.show() ;
    }
}
new class Advanced extends PagelistThumblist {}() ;
new class Administration extends PagelistThumblist {}() ;
new class Developer extends PagelistThumblist {}() ;
new class StructMenu extends PagelistThumblist {}() ;

new class DatabaseInfo extends Pagelist {
    show_content() {
        new StatBox() ;
        database.db.info()
        .then( doc => {
            globalPotData = new PotDataReadonly( doc, structDatabaseInfo );
            })
        .catch( err => log.err(err) );
        thumbs.show() ;
    }

}() ;

new class Settings extends Pagelist {
    show_content() {
        new TextBox("Display Settings") ;
        const doc = Object.assign( {}, settings ) ;
        globalPotData = new SettingsData( doc, structSettings );
    }
}() ;

export class Storage { //convenience class
    // all values placed in global scope as well
    
    set( cname, value ) {
        localStorage.setItem( cname, JSON.stringify(value) );
        globalThis[cname] = value;
    }
    
    del( cname ) {
        localStorage.removeItem(cname);
        globalThis[cname] = null;
    }
    
    get( cname ) {
        // local storage
        const ls = localStorage.getItem(cname);
        if ( ls == null ) {
            return null ;
        }

        let ls_parsed;
        try {
            ls_parsed = JSON.parse( ls ) ;
        }
        catch {
            ls_parsed = ls ;
        }
        return ls_parsed ;
    }
    
    clear() {
        localStorage.clear();
    }
}
export const storage = new Storage() ;

new class MakeQR extends Pagelist {
    show_content() {
        new StatBox() ;
        document.getElementById("URLtitle").innerText = "Web Link" ;
        new QRious( {
            value: address.bare_url.href,
            element: document.getElementById("qr"),
            size: 300,
        });
        document.getElementById("MakeURLtext").href = address.bare_url.href ;
        document.getElementById("CopyURLtext").onclick = () => {
            navigator.clipboard.writeText( address.bare_url.toString() )
            .catch( err => log.err(err) );
            } ;
    }
}() ;

new class PotPrint extends Pagelist {
    show_content() {
        if ( pot.isSelected() ) {
            database.db.get( pot.id )
            .then( (doc) => globalPotData = new PotDataPrint( doc, structData.Data.concat(structData.Images) ) )
            .catch( (err) => {
                log.err(err);
                page.show( "back" );
                });
        } else {
            page.show( "back" );
        }
    }
}() ;

new class AllPieces extends Pagelist {
    show_content() {
        pot.unselect() ;
        new StatBox() ;
        const table = new PotTable();
        pot.getAllIdDoc()
        .then( (docs) => table.fill(docs.rows ) )
        .catch( (err) => log.err(err) );
        thumbs.show() ;
    }
}() ;

new class Orphans extends Pagelist {
    show_content() {
        pot.unselect() ;
        new StatBox() ;
        const table = new OrphanTable();
        pot.getAllIdDoc()
        .then( (docs) => table.fill(docs.rows ) )
        .catch( (err) => log.err(err) );
        thumbs.show() ;
    }
}() ;

new class AssignPic extends Pagelist {
    show_content() {
        page.forget(); // don't return here
        // Title adjusted to source and number
        if ( pot.pictureSource.files.length == 0 ) {
            // No pictures taken/chosen
            return ;
        } else if (pot.pictureSource.id=="HiddenPix") {
            new TextBox( `New Photo. Assign to which piece?` ) ;
        } else {
            if (pot.pictureSource.files.length == 1 ) {
                new TextBox( "1 image selected. Assign to which piece?" ) ;
            } else {
                new TextBox( `${pot.pictureSource.files.length} images selected. Assign to which piece?` ) ;
            }
        }
        // make table
        const table = new AssignTable();
        pot.getAllIdDoc()
        .then( (docs) => table.fill(docs.rows ) )
        .catch( (err) => log.err(err) );
    }
}() ;

class StructShow extends Pagelist {
    // "struct_name" from derived classes
    // "struct_title" from derived classes
    constructor( structname, structtitle ) {
        super() ;
        this.struct_name = structname ;
        this.struct_title = structtitle ;
    }

    show_content() {
        pot.unselect() ;
        new TextBox("Field Structure") ;
        document.getElementById("StructShowTitle").innerText=this.struct_title ?? "" ;
        document.getElementById("struct_json").innerText = JSON.stringify( this.struct_name, null, 2 ) ;
        thumbs.show() ;
    }
}

new class StructGeneralPot extends StructShow {}( structData.Data, "Data Fields") ;
new class StructImages extends StructShow {}( structData.Images, "Image Fields") ;
new class StructDatabaseInfo extends StructShow {}( structDatabaseInfo, "Database Metadata") ;
new class StructSettings extends StructShow {}( structSettings, "Display Settings") ;

class ListGroup extends Pagelist {
    constructor( fieldname ) {
        super() ;
        this.field_name = fieldname ;
    }
    
    // "field_name" from struct in derived classes
    show_content() {
        pot.unselect() ;
        const item = structData.Data.find( i => i.name == this.field_name ) ;
        if ( item ) {
            const text = `grouped by ${item?.alias ?? item.name}` ;
            let table = null ;
            switch (item.type) {
                case "radio":
                case "list":
                case "text":
                    table = new MultiTable( (doc)=> {
                        if ( (item.name in doc) && (doc[item.name]!=="") ) {
                            return [doc[item.name] ] ;
                        } else {
                            return ["unknown"] ;
                        }
                        });
                    break ;
                case "checkbox":
                    table = new MultiTable( (doc)=> {
                        if ( (item.name in doc) && (doc[item.name].length > 0) ) {
                            return doc[item.name] ;
                        } else {
                            return ["unknown"] ;
                        }
                        });
                    break ;
                case "array":
                    table = new MultiTable( (doc)=> {
                        if ( (item.name in doc) && (doc[item.name].length>0) ) {
                            return doc[item.name].map( t => t.type ) ;
                        } else {
                            return ["unknown"] ;
                        }
                        });
                    break ;
            }
            new ListBox( text, table ) ;
            thumbs.show() ;
        } else {
            page.show("ListMenu");
        }
    }
}

new class ListSeries extends ListGroup {}("series") ;
new class ListForm extends ListGroup {}("type") ;
new class ListConstruction extends ListGroup {}("construction") ;
new class ListStage extends ListGroup {}("stage") ;
new class ListKiln extends ListGroup {}("kiln") ;
new class ListGlaze extends ListGroup {}("glaze") ;
new class ListClay extends ListGroup {}("clay") ;

new class ErrorLog extends Pagelist {
    show_content() {
        pot.unselect() ;
        new TextBox("Error Log");
        log.show() ;
        thumbs.show() ;
    }
}() ;

new class MainMenu extends Pagelist {
    show_content() {
        pot.unselect();
        new StatBox() ;
        thumbs.show() ;
    }
}() ;

new class ListMenu extends Pagelist {
    show_content() {
        pot.unselect();
        new StatBox() ;
        thumbs.show() ;
    }
}() ;

new class PotNew extends Pagelist {
    // record doesn't exist -- make one
    show_content() {
        page.forget();
        new TextBox("New Piece");
        if ( pot.isSelected() ) {
            // existing but "new"
            database.db.get( pot.id )
            .then( doc => globalPotData = new PotNewData( doc, structData.Data ) )
            .catch( err => log.err(err) ) ;
        } else {
            globalPotData = new PotNewData( pot.create(), structData.Data ) ;
        }
    }
}() ;

new class PotEdit extends Pagelist {
    show_content() {
        if ( pot.isSelected() ) {
            database.db.get( pot.id )
            .then( (doc) => globalPotData = new PotData( doc, structData.Data ))
             .catch( (err) => {
                log.err(err);
                page.show( "back" );
                });

        } else {
            page.show( "back" );
        }
    }
}() ;

new class PotPix extends Pagelist {
    show_content() {
        if ( pot.isSelected() ) {
            database.db.get( pot.id )
            .then( (doc) => globalPotData = new PotData( doc, structData.Images ))
            .catch( (err) => {
                log.err(err);
                page.show( "back" );
                });

        } else {
            page.show( "back" );
        }
    }
}() ;

new class PotPixEdit extends Pagelist {
    show_content(img_name) {
        if ( pot.isSelected() ) {
            database.db.get( pot.id )
            .then( (doc) => globalPotData = new PotDataEditMode( doc, structData.Images, img_name ))
            .catch( (err) => {
                log.err(err);
                page.show( "back" );
                });

        } else {
            page.show( "back" );
        }
    }
}() ;

new class PotPixLoading extends Pagelist {
    show_content() {
        document.querySelector(".ContentTitleHidden").style.display = "block";
        page.forget() ;
        if ( pot.isSelected() ) {
            database.db.get( pot.id )
            .then( (doc) => globalPotData = new PotData( doc, structData.Images ))
            .catch( (err) => {
                log.err(err);
                page.show( "back" );
                });
        } else {
            page.show( "back" );
        }
    }
}() ;

new class PotMenu extends Pagelist {
    show_content() {
        if ( pot.isSelected() ) {
            database.db.get( pot.id )
            .then( (doc) => pot.showPictures(doc) ) // pictures at bottom
            .catch( (err) => {
                log.err(err);
                page.show( "back" );
                })
                ;
        } else {
            page.show( "back" );
        }
    }
}() ;

new class SearchList extends Pagelist {
    show_content() {
        pot.unselect() ;
        new StatBox() ;
        search.newTable( new SearchTable() );
        thumbs.show() ;
    }
}() ;

export class Page { // singleton class
    constructor() {
        this.normal_screen = false ; // splash/screen/print for show_screen
        this.path = [];
        this.TL = document.getElementById("TopLeftImage") ;
        this.TLlast = null ;
        this.in_edit = false ;
        this.restored = false ;
    }

    reset() {
        // resets to just MainMenu
        this.path = [ "MainMenu" ] ;
    }

    back() {
        // return to previous page (if any exist)
        this.path.shift() ;
        if ( this.path.length == 0 ) {
            this.reset();
        }
    }

    current() {
        if ( this.path.length == 0 ) {
            this.reset();
        }
        return this.path[0];
    }

    add( page = null ) {
        if ( page == "back" ) {
            this.back();
        } else if ( page != null ) {
            const iop = this.path.indexOf( page ) ;
            if ( iop < 0 ) {
                // add to from of page list
                this.path.unshift( page ) ;
            } else {
                // trim page list back to prior occurence of this page (no loops, finite size)
                this.path = this.path.slice( iop ) ;
            }
        }
    }

    isThis( page ) {
        return this.current()==page ;
    }

    restore() {
        //console.log("RESTORE in_edit restored:",this.in_edit,this.restored);
        const state = storage.get("state") ;
        //console.log("stored state",state);

        if (state == null) {
            this.reset();
        }
        const page = state?.page ?? null ;
        const detail = state?.detail ?? null ;
        this.path = state?.path ?? [] ;
        if ( ! Array.isArray(this.path) ) {
            this.path = [] ;
        }
        pot.id = state?.id ?? null
        //console.log("page,path,potId",page,this.path,pot.id);

        if ( this.restored ) { // repeat
            if ( ! this.in_edit ) {
                //console.log("RESTORED",page);
                this.reshow( page, detail );
            } else {
                thumbs.replot() ;
            }
        } else { // first time
            //console.log("Just RESOTRE",page);
            this.restored = true ;
            this.show( page, detail ) ;
        }
    }

    store(page,detail) {
        storage.set("state", {
            page:page,
            detail:detail,
            path:this.path,
            id:pot.id,
        } );
    }

    forget() {
        // remove this page from the "back" list -- but don't actually go there
        this.back();
    }

    helpLink(help=null) {
        const helpLoc = "https://alfille.github.io/" ;
        const helpDir = "/potholder/" ;
        const helpTopic = help ?? this.current() ;
        window.open( new URL(`${helpDir}${helpTopic}.html`,helpLoc).toString(), '_blank' );
    } 
    
    show( page, detail=null ) { // main routine for displaying different "pages" by hiding different elements
        TitleBox.flash() ;
        this.in_edit = false ;
        // detail is for extra data to pass on
        if ( settings?.console == "true" ) {
            console.log("SHOW",page,"STATE",this.path);
            //console.trace() ;
        }

        this.add(page) ; // place in reversal list
        this.store( page, detail );

        // clear display objects
        globalPotData = null;
        document.querySelector(".ContentTitleHidden").style.display = "none";

        this.reshow( page, detail ) ;
    }
    
    reshow( page, detail=null ) { // re-entry for updated thumbs
        if ( settings?.console == "true" ) {
            //console.log("RESHOW",page,"STATE",this.path);
            //console.trace() ;
        }
        this.show_normal(); // basic page display setup

        // send to page-specific code
        const target_name = this.current() ;
        if ( target_name in Pagelist.pages ) {
            Pagelist.pages[target_name].show_page(target_name, detail) ;
        } else {
            this.back() ;
        }
    }
    
    show_normal() { // switch between screen and print
        switch ( page.current() ) {
            case "PotEdit":
            case "PotMenu":
            case "PotPix":
            case "PotPixEdit":
                this.TLlast = pot.id;
                this.TL.src = thumbs.display( pot.id ).src ;
                break ;
            default:
                if ( this.TLlast != null ) {
                    this.TLlast = null ;
                    this.TL.src = document.getElementById("LogoPicture").src;
                }
                break ;
        }

        if ( this.normal_screen ) {
            return ;
        }
        this.normal_screen = true ;
        // Clear Splash once really.
        document.getElementById("splash_screen").style.display = "none";
        
        document.querySelectorAll(".work_screen").forEach( v => v.style.display="grid" ) ;
        document.querySelectorAll(".print_screen").forEach( v => v.style.display="none" ) ;
    }    

    show_print() { // switch between screen and print
        if ( !this.normal_screen ) {
            return ;
        }
        this.normal_screen = false ;
        // Clear Splash once really.
        document.getElementById("splash_screen").style.display = "none";
        
        document.querySelectorAll(".work_screen").forEach( v => v.style.display="none" ) ;
        document.querySelectorAll(".print_screen").forEach( v => v.style.display="block" ) ;
    }    

    headerLink() {
        switch ( page.current() ) {
            case "PotEdit":
            case "PotPix":
            case "PotPixEdit":
                page.show( "PotMenu" ) ;
                break ;
            default:
                page.show("MainMenu") ;
                break ;
        }
    }    
}

export const page = new Page();
globalThis.page = page ;

export class Address {
    test_and_store() {
        // get and parse url -- essentially initilisation of this class
        this.url = new URL(window.location.href);
        this.bare_url = new URL( this.url) ;
        this.bare_url.pathname = "/" ;
        this.bare_url.search = "" ;
        [this.database, this.server] = this._split_url(this.bare_url);
        
        // create auth url
        this.auth_url = new URL( this.bare_url ) ;
        this.auth_url.host = [ "auth", this.server ].join('.');
        const p = new URLSearchParams() ;
        p.append("rd",this.url.href); // redirect back to this app
        this.auth_url.search = p.toString() ;
        
        // create database url
        this.database_url = new URL( this.bare_url ) ;
        this.database_url.pathname = "/couchdb/" ;        

        // get stored url
        const d = storage.get( "database" );
        const s = storage.get( "server"   );
        
        // store new url
        this._store_url();
        
        // return True if same url
        return ( d == this.database && s == this.server ) ;
    }
    
    _split_url( url ) {
        const [d, ...s] = url.host.split('.');
        return [ d, s.join('.') ];
    }
    
    _store_url() {
        storage.set( "database", this.database ) ;
        storage.set( "server", this.server ) ;
    }
    
    get_database() {
        // get database ( has /couchdb/ path )
        return this.database_url ;
    }
    
    get_auth() {
        // get authelia authorization (signin) page with redirect
        return this.auth_url ;
    }
    
    get_main() {
        // page for bad initial URL (i.e. not a database)
        const server = new URL( this.bare_url ) ;
        server.host = this.server ;
        return server ;
    }
    
    get_fauxton() {
        // link to Fauxton database administrative console
        const faux = new URL( this.bare_url ) ;
        faux.host = ["couchdb", this.server].join(".");
        return faux ;
    }
}
export const address = new Address() ;

// display settings and the like
export const settings = Object.assign( {
    console:"true",
    img_format:"webp",
    fullscreen: "big_picture",
    }, storage.get("settings") ) ;

// Application starting point
window.onload = () => {
    // Stuff into history to block browser BACK button
    window.history.pushState({}, '');
    window.addEventListener('popstate', ()=>window.history.replaceState({}, '') );

    // Service worker (to manage cache for off-line function)
    if ( navigator && ('serviceWorker' in navigator) ) {
        navigator.serviceWorker
        .register('/sw.js')
        .catch( err => log.err(err,"Service worker registration") );
    }
    
    // settings from storage (if there)
    const s = storage.get( "settings" ) ;
    if (s) {
        Object.assign( settings, s ) ;
    }
    
    if ( new URL(location.href).searchParams.size > 0 ) {
        // reload without search params
        window.location.href = "/index.html" ;
    }

    // set database from URL
    const new_address = address.test_and_store() ;
    database.acquire_and_listen() ; // look for database

    globalThis.globalResize = new ResizeObserver( entries => entries.forEach( e=> {
        switch (e.target.id) {
            case "Side":
                window.requestAnimationFrame( () => thumbs.replot_needed() ) ;
                break ;
            case "crop_canvas":
                crop.cacheBounds() ;
                break ;
        } ;
    }) ) ; 

    // Start pouchdb database
    database.open() ;  
    if ( database.db ) {
        // Thumbnails
        thumbs.setup() ; // just getting canvas from doc

        // Secondary indexes (create, prune and clean up views)
        const q = new Query();
        q.create( structData.Data.concat(structData.Images) )
        .then( () => database.status_msg("Creating thumbnail images...") )
        .then( () => thumbs.getAll() ) // create thumbs
        .then( () => database.status_msg("Completed thumbnail images") )
        .then( () => page.restore() ) // update page
        .catch( err => log.err(err,"Query cleanup") )
        ;

        // now start listening for any changes to the database
        database.db.changes({ 
            since: 'now', 
            live: true, 
            include_docs: true 
        })
        .on('change', (change) => {
            TitleBox.flash();

            if (change?.deleted) {
                thumbs.remove(change.id);
            } else {
                // If include_docs is true, change.doc is directly available
                thumbs.getOne(change.doc || change.id)
                    .then(() => page.restore());
            }
            })
        .on('error', (err) => {
            log.err(err, "Local changes feed error");
            });

        // start sync with remote database
        database.foreverSync();
        
        // Show screen
        ((settings.fullscreen=="always") ?
            document.documentElement.requestFullscreen()
            : Promise.resolve())
        .finally( _ => page.restore() ) ;
        
    } else {
        // bad database url
        window.location.href = address.get_main().href ;
    }
};

class TitleBox {
    show(html) {
        document.getElementById( "titlebox" ).innerHTML = html ;
    }
    static flash() {
        const box = document.getElementById( "titlebox" ) ;
        box.classList.remove('flash-once');
        void box.offsetWidth ;
        box.classList.add('flash-once');
    }
}

class BlankBox extends TitleBox {
    constructor() {
        super();
        this.show("") ;
    }
}

class TextBox extends TitleBox {
    constructor( text ) {
        super();
        this.show( `<B>${text}</B>` ) ;
    }
}

class ListBox extends TitleBox {
    constructor( text, table ) {
        super();
        this.show( `<B><button type="button" class="allGroup" id="close_all">&#10134;</button>&nbsp;&nbsp;<button type="button" class="allGroup" id="open_all">&#10133;</button>&nbsp;&nbsp;${text}</B>` ) ;
        document.getElementById("close_all").onclick = ()=>table.close_all();
        document.getElementById("open_all").onclick = ()=>table.open_all();
    }
}

class StatBox extends TitleBox {
    constructor() {
        super();
        database.db.query("qPictures", { reduce:true, group: false })
        .then( stat => this.show( `Pieces: ${stat.rows[0].value.count}, Pictures: ${stat.rows[0].value.sum}` ) )
        .catch( _ => this.show( 'No Pieces, yet' ) );
    }
}

class Query {
    static version = 2 ; // change to force renewal (value is arbitrary)
    constructor() {
        this.version = `${Query.version}` ;
    }
    
    create(struct) {
        const queries = this.struct_parse(struct) ; // query entries
        // add image statistics
        queries.push( ({
            _id: "_design/qPictures",
            views: {
                qPictures: {
                    map: function(doc) { 
                        emit( doc._id, ('images' in doc) ? doc.images.length : 0 ); 
                    }.toString(), 
                    reduce: '_stats',
                },
            },
        }) );
        return Promise.all( queries.map( (ddoc) => {
            database.db.get( ddoc._id )
            .then( doc => {
                // update if version number has changed
                if ( this.version !== doc.version ) {
                    ddoc._rev = doc._rev;
                    ddoc.version = this.version ;
                    return database.db.put( ddoc );
                } else {
                    return Promise.resolve(true);
                }
                })
            .catch( () => {
                // assume because this is first time and cannot "get"
                return database.db.put( ddoc );
                });
            }))
        .then( _ => this.prune_queries() )
        .then( _ => database.db.viewCleanup() )
        .catch( (err) => log.err(err) );
    }
    
    struct_parse(struct) {
        // create query definision (_design document) by parsing structure and finding:
        // 1. Query strings
        // 2. Query strings buried in an array (members)
        // query gives the name of the search and it is grouped by name
        return struct.map( e => {
            if ( "query" in e ) { // primary query field
                const f = `(doc) => { if ( "${e.name}" in doc ) { emit(doc.${e.name}) ; }}`;
                return ({
                    _id: `_design/${e.query}`,
                    views: {
                        [e.query]: {
                            map: f,
                            reduce: "_count",
                        },
                    },
                }) ;
            } else if ("members" in e) { // query field in array (or ImageArray)
                return e.members.filter( m => "query" in m ).map( m => {
                    const f = `(doc) => { if ( "${e.name}" in doc ){doc.${e.name}.forEach(g=> { if ( "${m.name}" in g ) { emit(g.${m.name}); }});}};`;
                    return ({
                        _id: `_design/${m.query}`,
                        views: {
                            [m.query]: {
                                map: f,
                                reduce: "_count",
                            },
                        },
                    }) ; 
                    }) ;
            } else { // no query -- will filter out
                return null ;
            }}).flat().filter( x => x != null ) ;
    }
    
    prune_queries() {
        // remove old entries (don't match version string)
        return database.db.allDocs( {
            startkey: "_design/",
            endkey:   "_design/\uffff",
            include_docs: true,
        } )
        .then( docs => docs.rows.filter( r=> r.doc.version !== this.version ) )
        .then( rows => Promise.all( rows.map( r => database.db.remove(r.doc)) ) ) ;
    }
}

class PotImages {    
    constructor( doc ) {
        // uses images array in doc
        //  image: name
        //  crop: dimensions
        this.images = doc?.images ?? [] ;
        this.pid = doc._id ;
        // doc does not need to have attachments included.
    }

    getURL( img_name ) {
        return database.db.getAttachment( this.pid, img_name )
        .then( data => URL.createObjectURL(data) ) ;
    }
    
    displayClickable(img_name, pic_size = "small_pic", new_crop = null, editable = true) {
        const img = new Image();
        const canvas = document.createElement("canvas");
        canvas.width = (pic_size === "small_pic") ? 60 : 120;
        canvas.classList.add("click_pic");

        let crop = [];

        const closeModal = () => {
            screen.orientation.onchange = null;
            if (settings.fullscreen === "big_picture" && document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
            }
            document.getElementById('modal_id').style.display = 'none';
        };

        // Render Modal Content
        const renderModal = () => {
            this.getURL(img_name)
                .then(url2 => {
                    const img2 = new Image();
                    img2.onload = () => {
                        URL.revokeObjectURL(url2);
                        const canvas2 = document.getElementById("modal_canvas");
                        const [cw, ch] = rightSize(crop[2], crop[3], window.innerWidth, window.innerHeight - 75);
                        
                        canvas2.width = window.innerWidth;
                        canvas2.height = ch;
                        canvas2.getContext("2d").drawImage(img2, crop[0], crop[1], crop[2], crop[3], 0, 0, cw, ch);

                        document.getElementById("modal_caption").innerText = this.images.find(e => e.image === img_name)?.comment ?? "";
                        document.getElementById("modal_id").style.display = "block";

                        // Re-render modal on orientation change without triggering a full click cycle
                        screen.orientation.onchange = () => renderModal();
                    };
                    img2.src = url2;
                })
                .catch(err => log.err(err));
        };

        this.getURL(img_name)
            .then(url => {
                img.onload = () => {
                    URL.revokeObjectURL(url);
                    crop = new_crop ?? this.images.find(i => i.image === img_name)?.crop ?? [0, 0, img.naturalWidth, img.naturalHeight];
                    if (crop.length !== 4) crop = [0, 0, img.naturalWidth, img.naturalHeight]; // uncropped

                    canvas.height = canvas.width * crop[3] / crop[2]; // scale height
                    canvas.getContext("2d").drawImage(img, crop[0], crop[1], crop[2], crop[3], 0, 0, canvas.width, canvas.height);
                };

                canvas.onclick = () => {
                    screen.orientation.onchange = null;

                    // Request Fullscreen synchronously inside user gesture
                    if (settings.fullscreen === "big_picture" && !document.fullscreenElement) {
                        document.documentElement.requestFullscreen()
                        .catch(() => {});
                    }

                    // Bind static UI controls
                    document.getElementById("modal_close").onclick = closeModal;

                    const edit = document.getElementById("modal_edit");
                    if (editable) {
                        edit.style.visibility = "visible";
                        edit.onclick = () => {
                            closeModal();
                            page.show("PotPixEdit", img_name);
                        };
                    } else {
                        edit.style.visibility = "hidden";
                    }

                    renderModal(); // show it now
                };

                img.src = url;
            })
            .catch(err => log.err(err));

        return canvas;
    }

    print_display( img_name ) {
        // full sized but cropped
        const img = new Image() ;
        const canvas = document.createElement("canvas");
        let crop = [] ;
        this.getURL( img_name )
        .then( url => {
            img.onload = () => {
                URL.revokeObjectURL(url) ;
                crop = this.images.find( i => i.image==img_name)?.crop ?? null ;
                if ( !crop || crop.length!=4 ) {
                    crop = [0,0,img.naturalWidth,img.naturalHeight] ;
                }
                canvas.width = crop[2] ;
                canvas.height = crop[3] ;
                canvas.getContext("2d").drawImage( img, crop[0], crop[1], crop[2], crop[3], 0, 0, crop[2], crop[3] ) ;
                } ;
            img.src=url ;
            canvas.classList.add("print_pic");
            })
        .catch( err => log.err(err)) ;
        return canvas ;
    }

    displayAll() {
        return this.images.map( k=> this.displayClickable(k.image,"medium_pic") ) ;
    }    
}


class Thumbs {
    constructor() {
        this.thumblist = {} ;
        this.showing = false ;
        this.side = document.getElementById("Side");
        this.side.onclick = (e) => this.click(e) ;
        this.nside = 0 ;
        this.bottom = document.getElementById("Bottom");
        this.head = document.getElementById("headerbox");
    }

    click(e) {
        if ( e.target.nodeName == "IMG" ) {
            pot.select( e.target.title ) ;
            page.show("PotMenu") ;
        }
    }

    setup() {
        // after onload
        this.canvas = document.getElementById("thumbnail"); // defines the thumbnail size
        this.ctx = this.canvas.getContext( "2d" ) ;
        this.NoPicture = null ; // uses default "NoPicture"
    }

    _create(doc) {
        const pid = doc._id;

        // 1. Guard clause returns a resolved promise immediately
        if ((doc?.images ?? []).length < 1) {
            return Promise.resolve();
        }

        // 2. Return the outer promise chain
        return database.db.getAttachment(pid, doc.images[0].image)
            .then(data => {
                return new Promise((resolve, reject) => {
                    const url = URL.createObjectURL(data);
                    const t_img = new Image();

                    t_img.onerror = (err) => {
                        URL.revokeObjectURL(url);
                        reject(err);
                    };

                    t_img.onload = () => {
                        URL.revokeObjectURL(url);

                        try {
                            let crop = doc.images[0]?.crop;
                            if (!crop || crop.length !== 4) {
                                crop = [0, 0, t_img.naturalWidth, t_img.naturalHeight];
                            }

                            // sw/sh in canvas units
                            const [iw, ih] = rightSize(this.canvas.width, this.canvas.height, crop[2], crop[3]);

                            // center and crop to maintain 1:1 aspect ratio
                            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                            this.ctx.drawImage(
                                t_img, 
                                crop[0] + (crop[2] - iw) / 2, 
                                crop[1] + (crop[3] - ih) / 2, 
                                iw, 
                                ih, 
                                0, 
                                0, 
                                this.canvas.width, 
                                this.canvas.height
                            );

                            // 3. Wrap canvas.toBlob in a Promise to resolve when finished
                            this.canvas.toBlob((blob) => {
                                if (blob) {
                                    this.thumblist[pid] = blob;
                                }
                                resolve(blob);
                            });
                        } catch (renderErr) {
                            // Log rendering error (e.g. tainted canvas or invalid dimensions)
                            // and resolve with null so callers/loops can continue safely
                            log.err(`Canvas render error on doc ${pid}:`, renderErr);
                            resolve(null);
                        }
                    };

                    t_img.src = url;
                });
            })
            .catch(err => {
                log.err(err);
            });
    }

    getOne( pid = pot.id ) {
        return database.db.get( pid )
        .then( doc => this._create(doc) )
        .catch( err => log.err(err) );
    }

    getAll() {
        return pot.getAllIdDoc()
            .then(docs => {
                const rows = docs.rows || [];
                if (rows.length === 0) return;

                if ('requestIdleCallback' in window) {
                    // 1. Wrap requestIdleCallback in a Promise
                    return new Promise(resolve => {
                        window.requestIdleCallback(() => {
                            // Assuming getAllList returns a Promise or handles _create calls
                            resolve(this.getAllList(rows));
                        }, { timeout: 100 });
                    });
                } else {
                    // 2. Map rows to _create promises and await them all
                    return Promise.all(rows.map(r => this._create(r.doc))) ;
                }
            })
            .catch(err => log.err(err));
    }

    getAllList(rows) {
        if (!rows || rows.length === 0) {
            return Promise.resolve();
        }

        const r = rows.pop();

        // 1. Await the creation of the current item's thumbnail
        return this._create(r.doc).then(() => {
            if (rows.length > 0) {
                // 2. Wrap the next idle step in a Promise to chain recursion
                return new Promise(resolve => {
                    window.requestIdleCallback(() => {
                        resolve(this.getAllList(rows));
                    }, { timeout: 100 });
                });
            }
        });
    }
    
    display( pid = pot.id ) {
        const img = new Image(100,100);
        img.classList.add("ThumbPhoto");
        img.title = pid;
        if ( pid in this.thumblist ) {
            const url = URL.createObjectURL( this.thumblist[pid] );
            img.onload = () => URL.revokeObjectURL( url );
            img.src = url;
        } else {
            img.src = document.getElementById("NoPicture").src; // direct reuse
        }
        return img;
    }
    
    remove( pid ) {
        if ( pid in this.thumblist ) {
            delete this.thumblist[pid];
            page.restore() ;
        }
    }
    
    hide() {
        globalResize.unobserve( this.side ) ;
        this.side.innerHTML="";
        this.bottom.innerHTML="";
        this.showing = false ;
    }
    
    show() {
        this.nside = Math.floor(this.side.clientWidth / 106) * Math.floor(this.side.clientHeight / 106) ;
        this.hide() ;
        if (this.nside==0) {
            this.side.style.padding = "0px" ;
            this.bottom.style.padding = "0px" ;
        } else if ( this.nside >= Object.keys(this.thumblist).length ) {
            this.side.style.padding = "0px" ;
            this.bottom.style.padding = "0px" ;
            this.side.style.alignContent="flex-start";
        } else {
            this.bottom.style.padding = `0px 0px 0px ${1+this.head.clientWidth % 106}px`;
            this.side.style.padding = `${this.side.clientHeight % 106}px 0px 0px 0px`;
            this.side.style.alignContent="flex-end";
        }
        this.bottom.onclick = (e) => this.click(e) ;
        Object.keys(this.thumblist).forEach( (p,i) => {
            if ( i < this.nside ) {
                this.side.appendChild(this.display(p)) ;
            } else {
                this.bottom.appendChild(this.display(p)) ;
            }
            });
        this.showing = true ;
        globalResize.observe( this.side ) ;
    }
    
    replot() {
        if ( this.showing ) {
            this.show() ;
        }
    }

    replot_needed() {
        if ( this.showing ) {
            if ( Math.floor(this.side.clientWidth / 106) * Math.floor(this.side.clientHeight / 106) != this.nside ) {
                this.show() ;
            }
        }
    }
}

export const thumbs = new Thumbs() ;

class SortTable {
    constructor( column_list, tableId, column_aliases=[] ) {
        this.tbl = document.getElementById(tableId);
        this.tbl.innerHTML = "";
        this.column_list = column_list;
        
        // column_aliases is a list in form (list of lists):
        //[ [fieldname, aliasname, transformfunction],...]
        
        this.aliases={}; // Eventually will have an alias and function for all columns, either default, or specified
        this.column_list.forEach( f => this.aliasAdd(f) ) ; // default aliases
        column_aliases.forEach( a => this.aliasAdd(a[0],a[1],a[2]) );

        // Table Head
        const header = this.tbl.createTHead();
        const row = header.insertRow(0);
        row.classList.add('head');
        this.column_list.forEach( (f,i) => row.insertCell(i).outerHTML=`<th>${this.aliases[f].name}</th>` );

        // Table Body
        const tbody = document.createElement('tbody');
        this.tbl.appendChild(tbody);

        this.dir = 1;
        this.lastth = -1;
        this.tbl.onclick = (e) => this.allClick(e);
    }

    aliasAdd( fieldname, aliasname=null, transformfunction=null ) {
        if ( !(fieldname in this.aliases) ) {
            // Add an entry (currently empty) for this column
            this.aliases[fieldname] = {} ;
        }
        this.aliases[fieldname].name = aliasname ?? fieldname ;
        this.aliases[fieldname].value = ((record)=>{
            try {
                if ( transformfunction==null ) {
                    return record[fieldname];
                } else {
                    return transformfunction(record) ;
                }
            } catch(e) {
                log.err(e) ;
                return "";
            }
            }) ;
    }

    fill( doclist ) {
        // typically called with doc.rows from allDocs
        const tbody = this.tbl.querySelector('tbody');
        tbody.innerHTML = "";
        //let column_list = this.column_list;
        doclist.forEach( (doc) => {
            const row = tbody.insertRow(-1);
            const record = doc.doc;
            row.title=record._id;
            /* Select and edit -- need to make sure selection is complete*/
            this.column_list.forEach( (colname,i) => {
                const c = row.insertCell(i);
                c.innerHTML=(this.aliases[colname].value)(record) ;
            });
        });
    }
    
    allClick(e) {
        if (e.target.tagName == 'TH') {
            return this.sortClick(e);
        } else if (e.target.closest("tr")) {
            pot.select( e.target.closest("tr").title) ;
            page.show("PotMenu");
        }
    }

    resort() {
        if ( this.lastth < 0 ) {
            this.lastth = 0;
            this.dir = 1;
        }
        this.sortGrid(this.lastth);
    }

    sortClick(e) {
        const th = e.target;
        if ( th.cellIndex == this.lastth ) {
            this.dir = -this.dir;
        } else {
            this.dir = 1;
            this.lastth = th.cellIndex;
        }
        // if TH, then sort
        // cellIndex is the number of th:
        //   0 for the first column
        //   1 for the second column, etc
        this.sortGrid(th.cellIndex);
    }

    sortGrid(colNum) {
        const tbody = this.tbl.querySelector('tbody');
        if ( tbody == null ) {
            // empty table
            return;
        }

        const rowsArray = Array.from(tbody.rows);

        let type = "number";
        rowsArray.some( (r) => {
            const c = r.cells[colNum].innerText;
            if ( c == "" ) {
                //empty
            } else if ( isNaN( Number(r.cells[colNum].innerText) ) ) {
                type = "string";
                return true;
            } else {
                return true;
            }
        });

        // compare(a, b) compares two rows, need for sorting
        const dir = this.dir;
        let compare;

        switch (type) {
            case 'number':
                compare = (rowA, rowB) => (rowA.cells[colNum].innerText - rowB.cells[colNum].innerText) * dir;
                break;
            case 'string':
                compare = (rowA, rowB) => rowA.cells[colNum].innerText > rowB.cells[colNum].innerText ? dir : -dir;
                break;
        }

        // sort
        rowsArray.sort(compare);

        tbody.append(...rowsArray);
    }
}

class ThumbTable extends SortTable {
    constructor( column_list, tableId, column_aliases=[] ) {
        column_list.unshift("image");
        super( column_list, tableId, column_aliases ) ;
    }

    fill( doclist ) {
        // typically called with doc.rows from allDocs
        const tbody = this.tbl.querySelector('tbody');
        tbody.innerHTML = "";
        doclist.forEach( (doc) => {
            const row = tbody.insertRow(-1);
            const record = doc.doc;
            row.title=record._id;
            /* Select and edit -- need to make sure selection is complete*/

            // thumb
            row.insertCell(-1).appendChild( thumbs.display( record._id));
            // cells
            this.column_list
            .slice(1)
            .forEach( colname => {
                const c = row.insertCell(-1);
                c.innerHTML=(this.aliases[colname].value)(record) ;
            });
        });
    }
    
}

class PotTable extends ThumbTable {
    constructor(
        column_list=["type","series","start_date" ],
        tableId="AllPiecesTable",
        column_aliases=
            [
                ["Thumbnail","Picture", (doc)=> `${doc.artist}`],
                ['start_date','Date',null],
                ['series','Series',null],
                ['type','Form',null]
            ] ) {
        super( column_list, tableId, column_aliases ) ;
    }
}

class OrphanTable extends PotTable {
    constructor(
        column_list=["_id","fields" ],
        tableId="AllPiecesTable",
        column_aliases=
            [
                ["Thumbnail","Picture", (doc)=> `${doc.artist}`],
                ['fields','Orphans',(doc)=>this.ofields(doc)],
                ['_id','ID',(doc)=>`${doc._id}`]
            ] ) {
        
        super( column_list, tableId, column_aliases ) ;

        // list of good fields
        this.gfields = [ 
            structData.Data.map( s => s.name ),
            structData.Images.map( s => s.name ),
            "author",
            ].flat();
    }

    ofields(doc) {
        return Object.keys(doc)
            .filter( k=>k[0] != '_' )
            .filter( k=>!(this.gfields.includes(k)) )
            .map( k=> `${k}: ${doc[k]}` )
            .join("\n") ;
    }
}

class MultiTable {
    constructor( category_func, column_list=["type","series","start_date" ], column_aliases=[] ) {
        /* category_func outputs a category array:
         *  [] or  [category] or [category1, category2,...]
         * 
         * column_list is a list of document field names that correspond to actual columns in the table
         * 
         * column_aliases is a list of field ro alias translations to make the field names more readable in the column headers
         * 
         * Example:
         *  new MultiTable( (doc)=>[doc.artist] ) );
         * 
         * Design:
         * MultiTable creates a PotTable for each category (from the category_func output)
        */

        // categories
        // will be a {category:[doc list]}
        this.category_tables = {} ;

        // parent container
        const parent = document.getElementById("MultiTableContent") ;
        parent.innerHTML="";
        const fieldset = document.getElementById("templates").querySelector(".MultiFieldset");
        
        this.apply_cat( category_func )
        .then( () => Object.keys(this.category_tables).toSorted().forEach( cat => {
            // fieldset holds a sorttable
            const fs = fieldset.cloneNode( true ) ;
            fs.querySelector(".multiCat").innerText = `${cat} (${this.category_tables[cat].rows.length})` ;

            // setup table
            const tb = fs.querySelector("table");
            tb.id = `MT${cat}` ;
            tb.style.display="";
            parent.appendChild(fs) ;
            const cl = [...column_list] ;
            this.category_tables[cat].table=new PotTable( cl, tb.id ) ;

            // put data in it
            this.category_tables[cat].table.fill(this.category_tables[cat].rows) ;

            // fieldset open/close toggle
            this.category_tables[cat].visible=true ;
            const plus = fs.querySelector(".triggerbutton") ;
            this.category_tables[cat].button = plus;
            plus.onclick = () => {
                thumbs.hide();
                if ( this.category_tables[cat].visible ) {
                    plus.innerHTML= "&#10133;" ;
                    tb.style.display = "none" ;
                    this.category_tables[cat].visible = false ;
                } else {
                    plus.innerHTML= "&#10134;" ;
                    tb.style.display = "" ;
                    this.category_tables[cat].visible = true ;
                }
                thumbs.show();
            } ;                
        })) ;
    }
    
    // apply the function on all records to get categorized records
    //  [ cat:doc]
    apply_cat( category_func ) {
        const a2a = [] ;
        return pot.getAllIdDoc()
        .then( docs => docs.rows
            .forEach( r => (category_func( r.doc )??['unknown'])
                .forEach( c => a2a.push( [c,r] ))
                 ))
        .then( () => this.arrays2object( a2a ) );
    }
        
    // split into separate records per category
    // coallesce list into object -- can be sent to PotTable
    arrays2object( arrays ) {
        arrays.forEach( ([k,v]) => {
            if ( k in this.category_tables ) {
                this.category_tables[k].rows.push(v) ;
            } else {
                this.category_tables[k]={rows:[v]} ;
            }
        }) ;
    }
    
    open_all() {
        Object.keys(this.category_tables).forEach(cat => {
            if ( ! this.category_tables[cat].visible ) {
                this.category_tables[cat].button.click() ;
            }
        });
    }
                
    close_all() {
        Object.keys(this.category_tables).forEach(cat => {
            if ( this.category_tables[cat].visible ) {
                this.category_tables[cat].button.click() ;
            }
        });
    }
}

class AssignTable extends ThumbTable {
    constructor(
        column_list=["type","series","start_date" ],
        tableId="AssignPicTable",
        column_aliases=
            [
                ["Thumbnail","Picture", (doc)=> `${doc.artist}`],
                ['start_date','Date',null],
                ['series','Series',null],
                ['type','Form',null]
            ] ) {
        super( column_list, tableId, column_aliases ) ;
    }
}


class SearchTable extends ThumbTable {
    constructor() {
        super( 
        ["Field","Text"], 
        "SearchListTable"
        );
    }

    fill( doclist ) {
        // typically called with doc.rows from allDocs
        const tbody = this.tbl.querySelector('tbody');
        tbody.innerHTML = "";
        doclist.forEach( (doc) => {
            const row = tbody.insertRow(-1);
            const record = doc.doc;
            row.title=`${record._id} # ${record.Link}`;
            /* Select and edit -- need to make sure selection is complete*/
            // thumb
            row.insertCell(-1).appendChild( thumbs.display(record._id));
            // cells
            this.column_list
            .slice(1)
            .forEach( colname => {
                const c = row.insertCell(-1);
                c.innerHTML=(this.aliases[colname].value)(record) ;
            });
        });
    }

    allClick(e) {
        if (e.target.tagName == 'TH') {
            return this.sortClick(e);
        } else if (e.target.closest("tr")) {
            const [id,targetPage] = e.target.closest("tr").title.split(" # ") ;
            pot.select( id ) ;
            page.add( "PotMenu" );
            page.show( targetPage );
        }
    }
}

export class Search { // singleton class
    constructor() {
        this.select_id = null ;

        this.field_alias={} ;
        this.field_link={} ;
            this.fields = [] ;

        this.structStructure= ({
            PotEdit:    structData.Data,
            PotPix:     structData.Images,
            });

        // Extract fields fields
        Object.entries(this.structStructure).forEach( ([k,v]) =>
            this.structFields(v)
            .forEach( fn => {
                this.field_link[fn]=k ;
                this.fields.push(fn);
                })
            );
    }

    resetTable () {
        this.setTable([]);
    } 

    select(id) {
        this.select_id = id;
    }

    toTable() {
        const needle = document.getElementById("searchtext").value;

        if ( needle.length == 0 ) {
            return this.resetTable();
        }
        database.db.search(
            { 
                query: needle,
                fields: this.fields,
                highlighting: true,
                mm: "80%",
            })
        .then( x => x.rows.map( r =>
            Object.entries(r.highlighting)
            .map( ([k,v]) => ({
                _id:r.id,
                Field:this.field_alias[k],
                Text:v,
                Link:this.field_link[k],
                })
            )) 
            )
        .then( res => res.flat() )
        .then( res => res.map( r=>({doc:r}))) // encode as list of doc objects
        .then( res=>this.setTable(res)) // fill the table
        .catch(err=> {
            log.err(err);
            this.resetTable();
            });
    }

    newTable( table ) {
        this.table = table ;
        this.setTable() ;
    }
    
    setTable( docs=[] ) {
        this.table.fill(docs);
    }

    structParse( struct ) {
        return struct
        .filter( e=>!(['date','image'].includes(e.type)))
        .flatMap(e=>{
            const name=e.name;
            const alias=e?.alias??name;
            if ( ['array','image_array'].includes(e.type) ) {
                return this.structParse(e.members)
                    .map(o=>({
                        name: `${name}.${o.name}`,
                        alias: `${alias}.${o.alias}`
                        })) ;
            }
            return [{ name, alias }];
            });
    }
    structFields( struct ) {
        const sP = this.structParse( struct ) ;
        sP.forEach( o => this.field_alias[o.name]=o.alias );
        return sP.map( o => o.name ) ;
    }
}

// Set up text search
export const search = new Search() ;
globalThis.search = search ; // for index.html

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
        
globalThis.structRemoteUser = [
    {
        name:  "local",
        alias: "Local only",
        hint:  "No CouchDB server to replicate with",
        type:  "bool",
    },
    {
        name:  "username",
        hint:  "Your user name for access",
        type:  "text",
    },
    {
        name:  "address",
        alias: "Remote database server address",
        hint:  "alfille.online -- don't include database name",
        type:  "text",
        default: "",
    },
    {
        name:  "database",
        hint:  'Name of ceramic database (e.g. "potholder"',
        type:  "text",
        default: "",
    },
];

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
        hint:  "Database compaction done automaticslly?",
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
        hint: "Hide browser meniu choices",
        type: "radio",
        choices: ["never","big_picture","always"],
    }
] ;

// globals storage backed
globalThis. potId = null ;

// singleton class instances
globalThis. globalAddress  = null ;
globalThis. globalCropper  = null ;
globalThis. globalDatabase = null ;
globalThis. globalLog      = null ;
globalThis. globalPage     = null ;
globalThis. globalPot      = null ;
globalThis. globalPotData  = null ;
globalThis. globalSearch   = null;
globalThis. globalSettings = {} ;
globalThis. globalStorage  = null ;
globalThis. globalTable    = null ;
globalThis. globalThumbs   = null;

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

class CSV { // convenience class
    constructor() {
        this.columns = [
            "type", "series", "location", "start_date", "artist", "firing", "weight_start","weight_end", "construction", "clay.type", "glaze.type", "kiln"
            ] ;
        this.make_table() ;
    }
    
    download( csv ) {
        const filename = `${globalDatabase.database}_${globalDatabase.username}.csv` ;
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
        globalPot.getAllIdDoc()
        .then( docs => docs.rows.map( r => this.make_row( this.columns.map( c => this.get_text( c, r.doc ) ) ) ) )
        .then( data => data.join("\n") )
        .then( data => [this.make_headings(), data].join("\n") )
        .then( csv => this.download( csv ) )
        .catch( err => globalLog.err(err) ) ;
    }
}

globalThis.csv = () => new CSV() ;

class Log{
    // Logs errors and shows error page
    // unfortunately hides offending line
    constructor() {
        this.list = [];
    }
    
    err( err, title=null ) {
        // generic console.log of error
        const ttl = title ?? globalPage.current() ;
        const msg = err.message ?? err ;
        this.list.push(`${ttl}: ${msg}`);
        if ( globalSettings?.console == "true" ) {
            console.group() ;
            console.log( ttl, msg ) ;
            console.trace();
            console.groupEnd();
        }
        if ( globalPage.current() == "ErrorLog" ) {
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
globalLog = new Log() ;

class DatabaseManager { // convenience class
    // Access to remote (cloud) version of database
    constructor() {
        // remoteCouch contents
        this.username = null ;
        this.database = null ;
        this.address  = null ;
        this.local    = null ;
        
        this.remoteDB = null;
        this.problem = false ; // separates real connection problem from just network offline
        this.synctext = document.getElementById("syncstatus");
        this.db = null ;
        
    }
    
    load() {
        ["username","database","address","local"].forEach( x => this[x]=globalStorage.local_get(x) );
    }
    
    store() {
        ["username","database","address","local"].forEach( x => globalStorage.local_set(x,this[x]) );
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
        if ( globalThis.database && (globalThis.database !== "") ) {
            this.db = new PouchDB( globalThis.database, {auto_compaction: true} ); // open local copy
        }
    }

    
    present() {
        this.status( "good", "--network present--" ) ;
    }

    not_present() {
        this.status( "disconnect", "--network offline--" ) ;
    }

    // Initialise a sync process with the remote server
    foreverSync() {
        //document.getElementById( "userstatus" ).value = this.username;

        if ( this.local=="true" ) { // local -- no sync
            this.status("good","Local database only (no replication)");
            return ;
        }
            
        this.remoteDB = new PouchDB( globalAddress.database_url.href , {
            "skip_setup": "true",
            });
        if ( this.remoteDB ) {
            this.status( "good","download remote database");
            this.db.replicate.from( this.remoteDB )
                .catch( (err) => this.status("problem",`Replication from remote error ${err.message}`) )
                .finally( _ => this.syncer() );
        } else {
            this.status("problem","No remote database specified!");
        }
    }
    
    syncer() {
        this.status("good","Starting database intermittent sync");
        globalDatabase.db.sync( this.remoteDB ,
            {
                live: true,
                retry: true,
                filter: (doc) => doc._id.indexOf('_design') !== 0,
            } )
            .on('change', ()       => this.status( "good", "changed" ))
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
                    globalLog.err(msg,"Network status");
                }
                break ;
            case "problem":
                document.body.style.background="#d72e18"; // grey
                globalLog.err(msg,"Network status");
                this.problem = true ;
                break ;
            case "good":
            default:
                document.body.style.background="#172bae"; // heppy blue
                if ( this.lastState !== state ) {
                    globalLog.err(msg,"Network status");
                }
                this.problem = false ;
                break ;
        }
        this.synctext.value = msg ;
    }
            
    SecureURLparse( url ) {
        let prot = "https";
        let addr = url;
        let port = "6984";
        let spl = url.split("://") ;
        if (spl.length < 2 ) {
            addr=spl[0];
        } else {
            prot = spl[0];
            addr = spl[1];
        }
        spl = addr.split(":");
        if (spl.length < 2 ) {
            addr=spl[0];
        } else {
            addr = spl[0];
            port = spl[1];
        }
        return [prot,[addr,port].join(":")].join("://");
    }

    // Fauxton link
    fauxton() {
        window.open( `${globalDatabase.address}/_utils`, '_blank' );
    }
    
    clearLocal() {
        const remove = confirm("Remove the eMission data and your credentials from this device?\nThe central database will not be affected.") ;
        if ( remove ) {
            globalStorage.clear();
            // clear (local) database
            globalDatabase.db.destroy()
            .finally( _ => location.reload() ); // force reload
        } else {
            globalPage.show( "MainMenu" );
        }
    }

}
globalDatabase = new DatabaseManager() ;

class Storage { //convenience class
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
        globalThis[cname] = ls_parsed;
        return ls_parsed ;
    }
    
    clear() {
        localStorage.clear();
    }
}
globalStorage = new Storage() ;

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
        globalThumbs.hide() ;
        
        // hide Crop
        document.getElementById("crop_page").style.display="none" ;
        
        this.show_content(detail);
    }
    
    show_content() {
        // default version, derived classes may overrule
        // Simple menu page
    }
}

class PagelistThumblist extends Pagelist {
    show_content() {
        globalThumbs.show() ;
    }
}

new class Advanced extends PagelistThumblist {}() ;

new class Administration extends PagelistThumblist {}() ;

new class Developer extends PagelistThumblist {}() ;

new class StructMenu extends PagelistThumblist {}() ;

new class DatabaseInfo extends Pagelist {
    show_content() {
        new StatBox() ;
        globalDatabase.db.info()
        .then( doc => {
            globalPotData = new PotDataReadonly( doc, structDatabaseInfo );
            })
        .catch( err => globalLog.err(err) );
        globalThumbs.show() ;
    }

}() ;

new class RemoteDatabaseInput extends Pagelist {
    show_content() {
        new TextBox("Your Credentials") ;
        const doc = {} ;
        ["username","database","address","local"].forEach( x => doc[x] = globalDatabase[x] ) ;
        doc.default_address=`${window.location.protocol}//${window.location.host}/couchdb`;
        doc.default_database=window.location.hostname.split(".")[0] ;
        globalPotData = new DatabaseData( doc, structRemoteUser );
    }
}() ;

new class Settings extends Pagelist {
    show_content() {
        new TextBox("Display Settings") ;
        const doc = Object.assign( {}, globalSettings ) ;
        globalPotData = new SettingsData( doc, structSettings );
    }
}() ;

new class MakeURL extends Pagelist {
    show_content() {
        new StatBox() ;
        document.getElementById("URLtitle").innerText = "Web Link" ;
        let url = new URL( "/index.html", window.location.href ) ;
        if ( url.hostname == "localhost" ) {
            url = new URL( "/index.html", globalDatabase.address ) ;
            url.port = '';
        }
        ["username","database","address","local"].forEach( x => url.searchParams.append( x, globalDatabase[x] ) );
        new QRious( {
            value: url.toString(),
            element: document.getElementById("qr"),
            size: 300,
        });
        document.getElementById("MakeURLtext").href = url.toString() ;
    }
}() ;

new class MakeViewerURL extends Pagelist {
    show_content() {
        new StatBox() ;
        document.getElementById("URLtitle").innerText = "Viewer Link" ;
        let url = new URL( "/viewer/index.html", window.location.href ) ;
        if ( url.hostname == "localhost" ) {
            url = new URL( "/viewer/index.html", globalDatabase.address ) ;
            url.port = '';
        }
        ["username","database","address","local"].forEach( x => url.searchParams.append( x, globalDatabase[x] ) );
        new QRious( {
            value: url.toString(),
            element: document.getElementById("qr"),
            size: 300,
        });
        document.getElementById("MakeURLtext").href = url.toString() ;
    }
}() ;

new class PotPrint extends Pagelist {
    show_content() {
        if ( globalPot.isSelected() ) {
            globalDatabase.db.get( globalThis.potId )
            .then( (doc) => globalPotData = new PotDataPrint( doc, structData.Data.concat(structData.Images) ) )
            .catch( (err) => {
                globalLog.err(err);
                globalPage.show( "back" );
                });
        } else {
            globalPage.show( "back" );
        }
    }
}() ;

new class Help extends Pagelist {
    show_content() {
        window.open( new URL(`https://alfille.github.io/potholder`,location.href).toString(), '_blank' );
        globalPage.show("back");
    }
}() ;

new class AllPieces extends Pagelist {
    show_content() {
        globalPot.unselect() ;
        new StatBox() ;
        globalTable = new PotTable();
        globalPot.getAllIdDoc()
        .then( (docs) => globalTable.fill(docs.rows ) )
        .catch( (err) => globalLog.err(err) );
        globalThumbs.show() ;
    }
}() ;

new class Orphans extends Pagelist {
    show_content() {
        globalPot.unselect() ;
        new StatBox() ;
        globalTable = new OrphanTable();
        globalPot.getAllIdDoc()
        .then( (docs) => globalTable.fill(docs.rows ) )
        .catch( (err) => globalLog.err(err) );
        globalThumbs.show() ;
    }
}() ;

new class AssignPic extends Pagelist {
    show_content() {
        globalPage.forget(); // don't return here
        // Title adjusted to source and number
        if ( globalPot.pictureSource.files.length == 0 ) {
            // No pictures taken/chosen
            return ;
        } else if (globalPot.pictureSource.id=="HiddenPix") {
            new TextBox( `New Photo. Assign to which piece?` ) ;
        } else {
            if (globalPot.pictureSource.files.length == 1 ) {
                new TextBox( "1 image selected. Assign to which piece?" ) ;
            } else {
                new TextBox( `${globalPot.pictureSource.files.length} images selected. Assign to which piece?` ) ;
            }
        }
        // make table
        globalTable = new AssignTable();
        globalPot.getAllIdDoc()
        .then( (docs) => globalTable.fill(docs.rows ) )
        .catch( (err) => globalLog.err(err) );
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
        globalPot.unselect() ;
        new TextBox("Field Structure") ;
        document.getElementById("StructShowTitle").innerText=this.struct_title ?? "" ;
        document.getElementById("struct_json").innerText = JSON.stringify( this.struct_name, null, 2 ) ;
        globalThumbs.show() ;
    }
}

new class StructGeneralPot extends StructShow {}( structData.Data, "Data Fields") ;
new class StructImages extends StructShow {}( structData.Images, "Image Fields") ;
new class StructDatabaseInfo extends StructShow {}( structDatabaseInfo, "Database Metadata") ;
new class StructRemoteUser extends StructShow {}( structRemoteUser, "User Credentials") ;
new class StructSettings extends StructShow {}( structSettings, "Display Settings") ;

class ListGroup extends Pagelist {
    constructor( fieldname ) {
        super() ;
        this.field_name = fieldname ;
    }
    
    // "field_name" from struct in derived classes
    show_content() {
        globalPot.unselect() ;
        const item = structData.Data.find( i => i.name == this.field_name ) ;
        if ( item ) {
            new ListBox(`grouped by ${item?.alias ?? item.name}`) ;
            switch (item.type) {
                case "radio":
                case "list":
                case "text":
                    globalTable = new MultiTable( (doc)=> {
                        if ( (item.name in doc) && (doc[item.name]!=="") ) {
                            return [doc[item.name] ] ;
                        } else {
                            return ["unknown"] ;
                        }
                        });
                    break ;
                case "checkbox":
                    globalTable = new MultiTable( (doc)=> {
                        if ( (item.name in doc) && (doc[item.name].length > 0) ) {
                            return doc[item.name] ;
                        } else {
                            return ["unknown"] ;
                        }
                        });
                    break ;
                case "array":
                    globalTable = new MultiTable( (doc)=> {
                        if ( (item.name in doc) && (doc[item.name].length>0) ) {
                            return doc[item.name].map( t => t.type ) ;
                        } else {
                            return ["unknown"] ;
                        }
                        });
                    break ;
            }
            globalThumbs.show() ;
        } else {
            globalPage.show("ListMenu");
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
        globalPot.unselect() ;
        new TextBox("Error Log");
        globalLog.show() ;
        globalThumbs.show() ;
    }
}() ;
new class FirstTime extends Pagelist {
    show_content() {
        globalPot.unselect() ;
        new TextBox("Welcome") ;
        if ( globalDatabase.db !== null ) {
            globalPage.show("MainMenu");
        }
    }
}() ;

new class InvalidPiece extends Pagelist {
    show_content() {
        globalPage.forget() ; // don't return here
        globalPot.unselect();
        new StatBox() ;
        globalThumbs.show() ;
    }
}() ;

new class MainMenu extends Pagelist {
    show_content() {
        globalPot.unselect();
        new StatBox() ;
        globalThumbs.show() ;
    }
}() ;

new class ListMenu extends Pagelist {
    show_content() {
        globalPot.unselect();
        new StatBox() ;
        globalThumbs.show() ;
    }
}() ;

new class PotNew extends Pagelist {
    // record doesn't exist -- make one
    show_content() {
        globalPage.forget();
        new TextBox("New Piece");
        if ( globalPot.isSelected() ) {
            // existing but "new"
            globalDatabase.db.get( globalThis.potId )
            .then( doc => globalPotData = new PotNewData( doc, structData.Data ) )
            .catch( err => globalLog.err(err) ) ;
        } else {
            globalPotData = new PotNewData( globalPot.create(), structData.Data ) ;
        }
    }
}() ;

new class PotEdit extends Pagelist {
    show_content() {
        if ( globalPot.isSelected() ) {
            globalDatabase.db.get( globalThis.potId )
            .then( (doc) => globalPotData = new PotData( doc, structData.Data ))
             .catch( (err) => {
                globalLog.err(err);
                globalPage.show( "back" );
                });

        } else {
            globalPage.show( "back" );
        }
    }
}() ;

new class PotPix extends Pagelist {
    show_content() {
        if ( globalPot.isSelected() ) {
            globalDatabase.db.get( globalThis.potId )
            .then( (doc) => globalPotData = new PotData( doc, structData.Images ))
            .catch( (err) => {
                globalLog.err(err);
                globalPage.show( "back" );
                });

        } else {
            globalPage.show( "back" );
        }
    }
}() ;

new class PotPixEdit extends Pagelist {
    show_content(img_name) {
        if ( globalPot.isSelected() ) {
            globalDatabase.db.get( globalThis.potId )
            .then( (doc) => globalPotData = new PotDataEditMode( doc, structData.Images, img_name ))
            .catch( (err) => {
                globalLog.err(err);
                globalPage.show( "back" );
                });

        } else {
            globalPage.show( "back" );
        }
    }
}() ;

new class PotPixLoading extends Pagelist {
    show_content() {
        document.querySelector(".ContentTitleHidden").style.display = "block";
        globalPage.forget() ;
        if ( globalPot.isSelected() ) {
            globalDatabase.db.get( globalThis.potId )
            .then( (doc) => globalPotData = new PotData( doc, structData.Images ))
            .catch( (err) => {
                globalLog.err(err);
                globalPage.show( "back" );
                });
        } else {
            globalPage.show( "back" );
        }
    }
}() ;

new class PotMenu extends Pagelist {
    show_content() {
        if ( globalPot.isSelected() ) {
            globalDatabase.db.get( globalThis.potId )
            .then( (doc) => globalPot.showPictures(doc) ) // pictures at bottom
            .catch( (err) => {
                globalLog.err(err);
                globalPage.show( "back" );
                })
                ;
        } else {
            globalPage.show( "back" );
        }
    }
}() ;

new class SearchList extends Pagelist {
    show_content() {
        globalPot.unselect() ;
        new StatBox() ;
        globalTable = new SearchTable() ;
        globalSearch.setTable();
        globalThumbs.show() ;
    }
}() ;

class Page { // singleton class
    constructor() {
        this.normal_screen = false ; // splash/screen/print for show_screen
        this.path = [];
        this.TL = document.getElementById("TopLeftImage") ;
        this.TLlast = null ;
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
        } else if ( page == null ) {
            return ;
        } else {
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
        // detail is for extra data to pass on
        if ( globalSettings?.console == "true" ) {
            console.log("SHOW",page,"STATE",this.path);
        }
        // test that database is selected
        if ( globalDatabase.db == null || globalDatabase.database == null ) {
            // can't bypass this! test if database exists
            if ( page != "FirstTime" && page != "RemoteDatabaseInput" ) {
                this.show("RemoteDatabaseInput");
            }
        }

        this.add(page) ; // place in reversal list

        // clear display objects
        globalPotData = null;
        globalTable = null;
        document.querySelector(".ContentTitleHidden").style.display = "none";

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
        switch ( globalPage.current() ) {
            case "PotEdit":
            case "PotPix":
            case "PotPixEdit":
                this.TLlast = globalThis.potId ;
                this.TL.src = globalThumbs.displayThumb( globalThis.potId ) ;
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
        switch ( globalPage.current() ) {
            case "PotEdit":
            case "PotPix":
            case "PotPixEdit":
                globalPage.show( "PotMenu" ) ;
                break ;
            default:
                globalPage.show("MainMenu") ;
                break ;
        }
    }

    copy_to_clip() {
        navigator.clipboard.writeText( document.getElementById("MakeURLtext").href )
        .catch( err => globalLog.err(err) );
    }
    
}

globalPage = new Page();

class Address {
    test_and_store() {
        // get and parse url
        this.url = new URL(window.location.href);
        [this.database, this.server] = this.split_url(this.url);

        this.database_url = new URL( this.url.href ) ;
        this.database_url.pathname = "/couchdb" ;        

        // get stored url
        const d = globalStorage.get( "database" );
        const s = globalStorage.get( "server"   );
        
        // store new url
        this.store_url();
        
        // return True if same url
        return ( d == this.database && s == this.server ) ;
    }
    
    split_url( url ) {
        const [d, ...s] = url.host.split('.');
        return [ d, s.join('.') ];
    }
    
    database() {
        return this.database ;
    }
    
    store_url() {
        globalStorage.set( "database", this.database ) ;
        globalStorage.set( "server", this.server ) ;
    }
}
globalAddress = new Address() ;

class Username {
    fresh() {
        this.name = "Unknown" ;
        globalStorage.set("username",name) ;
    }

    get_name() {
        return this.fetchWithRetry('/api/me', 3, 1000)
        .then((response) => response.json())
        .then((user) => console.log('Loaded user:', user))
        .catch((err) => ({
            username: "Unknown",
            name: "Unknown",
            })
        );
    };
    
    fetchWithRetry(url, retries = 3, delay = 1000) {
        return fetch(url)
        .catch((error) => {
            if (retries > 0) {
                console.warn(`Network error getting username. Retrying in ${delay}ms... (${retries} attempts left)`);
                return new Promise((resolve) => setTimeout(resolve, delay))
                .then(() => fetchWithRetry(url, retries - 1, delay * 2));
            } else {
                throw error ;
            }
        });
    }
}

// Application starting point
window.onload = () => {
    const n = new Username() ; // test username
    console.log("Username",n.get_name() ) ;

    // Stuff into history to block browser BACK button
    window.history.pushState({}, '');
    window.addEventListener('popstate', ()=>window.history.replaceState({}, '') );

    // Service worker (to manage cache for off-line function)
    if ( navigator && ('serviceWorker' in navigator) ) {
        navigator.serviceWorker
        .register('/sw.js')
        .catch( err => globalLog.err(err,"Service worker registration") );
    }

    // Settings
    globalSettings = Object.assign( {
        console:"true",
        img_format:"webp",
        fullscreen: "big_picture",
        }, globalStorage.get("settings") ) ;
    
    // set database from URL
    const new_address = globalAddress.test_and_store() ;
    globalDatabase.acquire_and_listen() ; // look for database

    if ( new URL(location.href).searchParams.size > 0 ) {
        // reload without search params -- placed in Cookies
        window.location.href = "/index.html" ;
    }

    globalThis.globalResize = new ResizeObserver( entries => entries.forEach( e=> {
        switch (e.target.id) {
            case "Side":
                window.requestAnimationFrame( () => globalThumbs.replot_needed() ) ;
                break ;
            case "crop_canvas":
                globalCropper.cacheBounds() ;
                break ;
        } ;
    }) ) ; 

    // Start pouchdb database
    globalDatabase.open() ;       
    if ( globalDatabase.db ) {
        // Thumbnails
        globalThumbs.setup() ; // just getting canvas from doc

        // Secondary indexes (create, prune and clean up views)
        const q = new Query();
        q.create( structData.Data.concat(structData.Images) )
        .then( () => globalThumbs.getAll() ) // create thumbs
        .catch( err => globalLog.err(err,"Query cleanup") )
        ;

        // now start listening for any changes to the database
        globalDatabase.db.changes({ 
            since: 'now', 
            live: true, 
            include_docs: false 
            })
        .on('change', (change) => {
            if ( change?.deleted ) {
                globalThumbs.remove( change.id ) ;
            } else {
                globalThumbs.getOne( change.id ) ;
            }
            // update screen display
            if ( globalPage.isThis("AllPieces") ) {
                globalPage.show("AllPieces");
            }
            })
        .catch( err => globalLog.err(err,"Initial search database") );

        // start sync with remote database
        globalDatabase.foreverSync();

        // Show screen
        ((globalSettings.fullscreen=="always") ?
            document.documentElement.requestFullscreen()
            : Promise.resolve())
        .finally( _ => globalPage.show("MainMenu") ) ;
        
    } else {
        globalPage.reset();
        globalPage.show("FirstTime");
    }
};

class TitleBox {
    show(html) {
        //console.log("TITLEBOX",html);
        document.getElementById( "titlebox" ).innerHTML = html ;
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
    constructor( text ) {
        super();
        this.show( `<B><button type="button" class="allGroup" onclick="globalTable.close_all()">&#10134;</button>&nbsp;&nbsp;<button type="button" class="allGroup" onclick="globalTable.open_all()">&#10133;</button>&nbsp;&nbsp;${text}</B>` ) ;
    }
}

class StatBox extends TitleBox {
    constructor() {
        super();
        globalDatabase.db.query("qPictures", { reduce:true, group: false })
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
            globalDatabase.db.get( ddoc._id )
            .then( doc => {
                // update if version number has changed
                if ( this.version !== doc.version ) {
                    ddoc._rev = doc._rev;
                    ddoc.version = this.version ;
                    return globalDatabase.db.put( ddoc );
                } else {
                    return Promise.resolve(true);
                }
                })
            .catch( () => {
                // assume because this is first time and cannot "get"
                return globalDatabase.db.put( ddoc );
                });
            }))
        .then( _ => this.prune_queries() )
        .then( _ => globalDatabase.db.viewCleanup() )
        .catch( (err) => globalLog.err(err) );
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
        return globalDatabase.db.allDocs( {
            startkey: "_design/",
            endkey:   "_design/\uffff",
            include_docs: true,
        } )
        .then( docs => docs.rows.filter( r=> r.doc.version !== this.version ) )
        .then( rows => Promise.all( rows.map( r => globalDatabase.db.remove(r.doc)) ) ) ;
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
        return globalDatabase.db.getAttachment( this.pid, img_name )
        .then( data => URL.createObjectURL(data) ) ;
    }
    
    displayClickable( img_name, pic_size="small_pic", new_crop=null, editable=true ) {
        const img = new Image() ;
        const canvas = document.createElement("canvas");
        switch ( pic_size ) {
            case "small_pic":
                canvas.width = 60 ;
                break;
            default:
                canvas.width = 120 ;
                break ;
        }
        canvas.classList.add("click_pic") ;
        let crop = [] ;
        this.getURL( img_name )
        .then( url => {
            img.onload = () => {
                URL.revokeObjectURL(url) ;
                crop = new_crop ;
                if ( !crop || crop.length!=4 ) {
                    crop = this.images.find( i => i.image==img_name)?.crop ?? null ;
                }
                if ( !crop || crop.length!=4 ) {
                    crop = [0,0,img.naturalWidth,img.naturalHeight] ;
                }
                const h = canvas.width * crop[3] / crop[2] ;
                canvas.height = h ;
                canvas.getContext("2d").drawImage( img, crop[0], crop[1], crop[2], crop[3], 0, 0, canvas.width, h ) ;
                } ;
            canvas.onclick=()=>{
                const img2 = new Image() ; // temp image
                document.getElementById("modal_canvas").width = window.innerWidth ;
                this.getURL( img_name )
                .then( url2 => {
                    img2.onload = () => {
                        URL.revokeObjectURL(url2) ;
                        const canvas2 = document.getElementById("modal_canvas");
                        const [cw,ch] = rightSize( crop[2], crop[3], window.innerWidth, window.innerHeight-75 ) ;
                        canvas2.height = ch ;
                        canvas2.getContext("2d").drawImage( img2, crop[0], crop[1], crop[2], crop[3], 0, 0, cw, ch ) ;
                        screen.orientation.onchange=()=>{
                            screen.orientation.onchange=()=>{};
                            document.getElementById('modal_id').style.display='none';
                            requestAnimationFrame( ()=>canvas.click() ) ;
                            } ;
                        } ;
                    document.getElementById("modal_close").onclick=()=>{
                        screen.orientation.onchange=()=>{};
                        if (globalSettings.fullscreen=="big_picture") {
                            if ( document.fullscreenElement ) {
                                document.exitFullscreen() ;
                            }
                        }
                        document.getElementById('modal_id').style.display='none';
                        };
                    document.getElementById("modal_down").onclick=()=> {
                        this.getURL( img_name )
                        .then( url => {
                            const link = document.createElement("a");
                            link.download = img_name;
                            link.href = url;
                            link.style.display = "none";

                            document.body.appendChild(link);
                            link.click(); // press invisible button
                            
                            // clean up
                            // Add "delay" see: https://www.stefanjudis.com/snippets/how-trigger-file-downloads-with-javascript/
                            setTimeout( () => {
                                window.URL.revokeObjectURL(link.href) ;
                                document.body.removeChild(link) ;
                            });
                        }) ;
                        } ;
                    const edit = document.getElementById("modal_edit") ;
                    if (editable) {
                        edit.style.visibility = "visible";
                        edit.onclick=()=> {
                            screen.orientation.onchange=()=>{};
                            if (globalSettings.fullscreen=="big_picture") {
                                if ( document.fullscreenElement ) {
                                    document.exitFullscreen() ;
                                }
                            }
                            document.getElementById('modal_id').style.display='none';
                            globalPage.show( "PotPixEdit", img_name ) ;
                            };
                    } else {
                        edit.style.visibility = "hidden";
                    }
                    ((globalSettings.fullscreen=="big_picture") ?
                        document.documentElement.requestFullscreen()
                        : Promise.resolve() )
                    .finally( _ => {
                        img2.src=url2;
                        document.getElementById("modal_caption").innerText=this.images.find(e=>e.image==img_name).comment;
                        document.getElementById("modal_id").style.display="block";
                        });
                    })
                .catch( err => globalLog.err(err) ) ;
            };

            img.src=url ;
            })
        .catch( err => globalLog.err(err)) ;
        return canvas ;
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
        .catch( err => globalLog.err(err)) ;
        return canvas ;
    }

    displayAll() {
        return this.images.map( k=> this.displayClickable(k.image,"medium_pic") ) ;
    }    
}

class Pot { // convenience class
    constructor() {
        this.pictureSource = document.getElementById("HiddenPix");
    }
    
    create() {
        // create new pot record
        return ({
            _id: Id_pot.makeId( this.doc ),
            type:"",
            series:"",
            author: globalDatabase.username,
            artist: globalDatabase.username,
            start_date: (new Date()).toISOString().split("T")[0],
            stage: "greenware",
            kiln: "none",
           });
    }
   
    del() {
        if ( this.isSelected() ) {        
            globalDatabase.db.get( globalThis.potId )
            .then( (doc) => {
                // Confirm question
                if (confirm(`WARNING -- about to delete this piece\n piece type << ${doc?.type} >> of series << ${doc.series} >>\nPress CANCEL to back out`)==true) {
                    return globalDatabase.db.remove(doc) ;
                } else {
                    throw "Cancel";
                }           
            })
            .then( _ => globalThumbs.remove( globalThis.potId ) )
            .then( _ => this.unselect() )
            .then( _ => globalPage.show( "back" ) )
            .catch( (err) => {
                if (err != "Cancel" ) {
                    globalLog.err(err);
                    globalPage.show( "back" ) ;
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
        return globalDatabase.db.allDocs(doc);
    }
        
    select( pid = globalThis.potId ) {
        globalThis.potId = pid ;
        // Check pot existence
        new TextBox("Piece Selected");
    }

    isSelected() {
        return ( globalThis.potId != null ) ;
    }

    unselect() {
        globalThis.potId = null;
//        if ( globalPage.isThis("AllPieces") ) {
//            const pt = document.getElementById("PotTable");
//        }
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

    save_pic( pid=globalThis.potId, i_list=[] ) {
        if ( i_list.length == 0 ) {
            return Promise.resolve(true) ;
        }
        const f = i_list.pop() ;
        return globalDatabase.db.get( pid )
        .then( doc => {
            if ( !("images" in doc ) ) {
                doc.images = [] ;
            }
            if ( doc.images.find( e => e.image == f.name ) ) {
                // exists, just update attachment
                return globalDatabase.db.putAttachment( pid, f.name, doc._rev, f, f.type )
                    .catch( err => globalLog.err(err)) ;
            } else {
                // doesn't exist, add images entry as well (to front)
                doc.images.unshift( {
                    image: f.name,
                    comment: "",
                    date: (f?.lastModifiedDate ?? (new Date())).toISOString(),
                    } );
                return globalDatabase.db.put( doc )
                    .then( r => globalDatabase.db.putAttachment( r.id, f.name, r.rev, f, f.type ) ) ;
            }
            })
        .then( _ => this.save_pic( pid, i_list ) ) ; // recursive
    }
                  

    newPhoto() {
        if ( ! globalPot.isSelected() ) { 
            globalPage.show("AssignPic") ;
            return ;
        }
        const i_list = [...this.pictureSource.files] ;
        if (i_list.length==0 ) {
            return ;
        }
        
        const pid = globalThis.potId
        globalPage.show("PotPixLoading");

        this.save_pic( pid, i_list )
        .then( () => globalThumbs.getOne( pid ) )
        .then( () => globalPage.add( "PotMenu" ) )
        .then( () => globalPage.show("PotPix") )
        .catch( (err) => {
            globalLog.err(err);
            })
        .finally( () => this.pictureSource.value = "" ) ;
    }
    
    AssignToNew() {
        const doc = this.create() ;
        //console.log("new",doc);
        globalDatabase.db.put( doc )
        .then( response => this.AssignPhoto( response.id ) )
        .catch( err => {
            globalLog.err(err);
            globalPage.show('MainMenu');
        }) ;
    }
            
    AssignPhoto(pid = globalThis.potId) {
        const i_list = [...this.pictureSource.files] ;
        if (i_list.length==0 ) {
            return ;
        }
        globalPage.show("PotPixLoading");
        globalPot.select( pid ) ;
        this.save_pic( pid, i_list )
        .then( _ => globalThumbs.getOne( pid ) )
        .then( _ => globalPage.add("PotMenu" ) )
        .then( _ => globalPage.show("PotPix") )
        .catch( (err) => {
            globalLog.err(err);
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

class Id_pot {
    static type = "p";
    static version = 0;
    static start="";
    static end="\uffff";
    
    static splitId( id=globalThis.potId ) {
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
            globalDatabase.username,
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

globalPot = new Pot() ;

class Thumb {
    constructor() {
        this.Thumbs = {} ;
        this.showing = false ;
        this.side = document.getElementById("Side");
        this.side.onclick = (e) => this.click(e) ;
        this.nside = 0 ;
        this.bottom = document.getElementById("Bottom");
        this.head = document.getElementById("headerbox");
    }

    click(e) {
        if ( e.target.nodeName == "IMG" ) {
            globalPot.select( e.target.title ) ;
            globalPage.show("PotMenu") ;
        }
    }

    setup() {
        // after onload
        this.canvas = document.getElementById("thumbnail"); // defines the thumbnail size
        this.ctx = this.canvas.getContext( "2d" ) ;
        this.NoPicture = null ; // uses default "NoPicture"
    }

    _create( doc ) {
        const pid = doc._id ;
        if ( (doc?.images??[]).length<1) {
            return ;
        }

        globalDatabase.db.getAttachment(pid, doc.images[0].image )
        .then(data => {
            const url = URL.createObjectURL(data) ;
            const t_img = new Image();
            t_img.onload = () => {
                URL.revokeObjectURL(url) ;
                let crop = doc.images[0]?.crop ;
                if ( !crop || crop.length!=4 ) {
                    crop = [0,0,t_img.naturalWidth,t_img.naturalHeight] ;
                }
                // sw/sh in canvas units
                const [iw,ih] = rightSize( this.canvas.width, this.canvas.height, crop[2], crop[3]  ) ;
                // center and crop to maintain 1:1 aspect ratio
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.drawImage( t_img, crop[0] + (crop[2]-iw)/2, crop[1] + (crop[3]-ih)/2, iw, ih, 0, 0, this.canvas.width, this.canvas.height ) ;
                this.canvas.toBlob( (blob) => this.Thumbs[pid] = blob );
                };
            t_img.src = url ;
        })
        .catch( err => globalLog.err(err) );
    }

    getOne( pid = globalThis.potId ) {
        return globalDatabase.db.get( pid )
        .then( doc => this._create(doc) )
        .then( _ => this.replot() )
        .catch( err => globalLog.err(err) );
    }

    getAll() {
        globalPot.getAllIdDoc()
        .then( docs => {
            if ( 'requestIdleCallback' in window ) {
                if ( docs.rows.length > 0 ) {
                    window.requestIdleCallback( () => this.getAllList(docs.rows),{timeout:100});
                }
            } else {
                docs.rows.forEach( r => this._create( r.doc ) ) ;
                this.replot() ;
            }
            })
        .catch( err => globalLog.err(err) ) ;
    }

    getAllList( rows ) {
        const r = rows.pop() ;
        this._create( r.doc ) ;
        if ( rows.length > 0 ) {
            window.requestIdleCallback( () => this.getAllList( rows ), {timeout:100} ) ;
        } else {
            this.replot() ;
        }
    }

    displayThumb( pid = globalThis.potId ) {
        const img = new Image(100,100);
        img.classList.add("ThumbPhoto");
        img.title = pid;
        if ( pid in this.Thumbs ) {
            const url = URL.createObjectURL( this.Thumbs[pid] );
            img.onload = () => URL.revokeObjectURL( url );
            img.src = url;
        } else {
            img.src = document.getElementById("NoPicture").src; // direct reuse
        }
        return img;
    }
    
    remove( pid ) {
        if ( pid in this.Thumbs ) {
            delete this.Thumbs[pid];
            this.replot() ;
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
        } else if ( this.nside >= Object.keys(this.Thumbs).length ) {
            this.side.style.padding = "0px" ;
            this.bottom.style.padding = "0px" ;
            this.side.style.alignContent="flex-start";
        } else {
            this.bottom.style.padding = `0px 0px 0px ${1+this.head.clientWidth % 106}px`;
            this.side.style.padding = `${this.side.clientHeight % 106}px 0px 0px 0px`;
            this.side.style.alignContent="flex-end";
        }
        this.bottom.onclick = (e) => this.click(e) ;
        Object.keys(this.Thumbs).forEach( (p,i) => {
            if ( i < this.nside ) {
                this.side.appendChild(this.displayThumb(p)) ;
            } else {
                this.bottom.appendChild(this.displayThumb(p)) ;
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

globalThumbs = new Thumb() ;

class SortTable {
    constructor( collist, tableId, aliaslist=[] ) {
        this.tbl = document.getElementById(tableId);
        this.tbl.innerHTML = "";
        this.collist = collist;
        
        // alias-list is a list in form (list of lists):
        //[ [fieldname, aliasname, transformfunction],...]
        
        this.aliases={}; // Eventually will have an alias and function for all columns, either default, or specified
        this.collist.forEach( f => this.aliasAdd(f) ) ; // default aliases
        aliaslist.forEach( a => this.aliasAdd(a[0],a[1],a[2]) );

        // Table Head
        const header = this.tbl.createTHead();
        const row = header.insertRow(0);
        row.classList.add('head');
        this.collist.forEach( (f,i) => row.insertCell(i).outerHTML=`<th>${this.aliases[f].name}</th>` );

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
                globalLog.err(e) ;
                return "";
            }
            }) ;
    }

    fill( doclist ) {
        // typically called with doc.rows from allDocs
        const tbody = this.tbl.querySelector('tbody');
        tbody.innerHTML = "";
        //let collist = this.collist;
        doclist.forEach( (doc) => {
            const row = tbody.insertRow(-1);
            const record = doc.doc;
            row.title=record._id;
            /* Select and edit -- need to make sure selection is complete*/
            this.collist.forEach( (colname,i) => {
                const c = row.insertCell(i);
                c.innerHTML=(this.aliases[colname].value)(record) ;
            });
        });
    }
    
    allClick(e) {
        if (e.target.tagName == 'TH') {
            return this.sortClick(e);
        } else if (e.target.closest("tr")) {
            globalPot.select( e.target.closest("tr").title) ;
            globalPage.show("PotMenu");
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
    constructor( collist, tableId, aliaslist=[] ) {
        collist.unshift("image");
        super( collist, tableId, aliaslist ) ;
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
            row.insertCell(-1).appendChild( globalThumbs.displayThumb( record._id));
            // cells
            this.collist
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
        collist=["type","series","start_date" ],
        tableId="AllPiecesTable",
        aliaslist=
            [
                ["Thumbnail","Picture", (doc)=> `${doc.artist}`],
                ['start_date','Date',null],
                ['series','Series',null],
                ['type','Form',null]
            ] ) {
        super( collist, tableId, aliaslist ) ;
    }
}

class OrphanTable extends PotTable {
    constructor(
        collist=["_id","fields" ],
        tableId="AllPiecesTable",
        aliaslist=
            [
                ["Thumbnail","Picture", (doc)=> `${doc.artist}`],
                ['fields','Orphans',(doc)=>this.ofields(doc)],
                ['_id','ID',(doc)=>`${doc._id}`]
            ] ) {
        
        super( collist, tableId, aliaslist ) ;

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
    constructor( cat_func, collist=["type","series","start_date" ], aliaslist=[] ) {
        // cat_func outputs a category array:
        // [] or  [category] or [category1, category2,...]
        // sort_func operates on a doc record

        /* Example:
         *  new MultiTable( "Artist", (doc)=>[doc.artist], "series",document.getElementById("MultiTableContent") );
        */

        // catagories
        this.cat_ob = {} ;

        // parent container
        const parent = document.getElementById("MultiTableContent") ;
        parent.innerHTML="";
        const fieldset = document.getElementById("templates").querySelector(".MultiFieldset");
        
        this.apply_cat( cat_func )
        .then( () => Object.keys(this.cat_ob).toSorted().forEach( cat => {
            // fieldset holds a sorttable
            const fs = fieldset.cloneNode( true ) ;
            fs.querySelector(".multiCat").innerText = `${cat} (${this.cat_ob[cat].rows.length})` ;

            // setup table
            const tb = fs.querySelector("table");
            tb.id = `MT${cat}` ;
            tb.style.display="";
            parent.appendChild(fs) ;
            const cl = [...collist] ;
            this.cat_ob[cat].table=new PotTable( cl, tb.id ) ;

            // put data in it
            this.cat_ob[cat].table.fill(this.cat_ob[cat].rows) ;

            // fieldset open/close toggle
            this.cat_ob[cat].visible=true ;
            const plus = fs.querySelector(".triggerbutton") ;
            this.cat_ob[cat].button = plus;
            plus.onclick = () => {
                globalThumbs.hide();
                if ( this.cat_ob[cat].visible ) {
                    plus.innerHTML= "&#10133;" ;
                    tb.style.display = "none" ;
                    this.cat_ob[cat].visible = false ;
                } else {
                    plus.innerHTML= "&#10134;" ;
                    tb.style.display = "" ;
                    this.cat_ob[cat].visible = true ;
                }
                globalThumbs.show();
            } ;                
        })) ;
    }
    
    // apply the function on all records to get categorized records
    apply_cat( cat_func ) {
        const a2a = [] ;
        return globalPot.getAllIdDoc()
        .then( docs => docs.rows
                        .forEach( r => (cat_func( r.doc )??['unknown'])
                            .forEach( c => a2a.push( [c,r] ))
                             ))
        .then( () => this.arrays2object( a2a ) );
    }
        
    // split into separate records per category
    arrays2object( arrays ) {
        arrays.forEach( ([k,v]) => {
            if ( k in this.cat_ob ) {
                this.cat_ob[k].rows.push(v) ;
            } else {
                this.cat_ob[k]={rows:[v]} ;
            }
        }) ;
    }
    
    open_all() {
        Object.keys(this.cat_ob).forEach(cat => {
            if ( ! this.cat_ob[cat].visible ) {
                this.cat_ob[cat].button.click() ;
            }
        });
    }
                
    close_all() {
        Object.keys(this.cat_ob).forEach(cat => {
            if ( this.cat_ob[cat].visible ) {
                this.cat_ob[cat].button.click() ;
            }
        });
    }
}

class AssignTable extends ThumbTable {
    constructor(
        collist=["type","series","start_date" ],
        tableId="AssignPic",
        aliaslist=
            [
                ["Thumbnail","Picture", (doc)=> `${doc.artist}`],
                ['start_date','Date',null],
                ['series','Series',null],
                ['type','Form',null]
            ] ) {
        super( collist, tableId, aliaslist ) ;
    }
}


class SearchTable extends ThumbTable {
    constructor() {
        super( 
        ["Field","Text"], 
        "SearchList"
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
            row.insertCell(-1).appendChild( globalThumbs.displayThumb(record._id));
            // cells
            this.collist
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
            const [id,page] = e.target.closest("tr").title.split(" # ") ;
            globalPot.select( id ) ;
            globalPage.add( "PotMenu" );
            globalPage.show( page );
        }
    }
}

class Search { // singleton class
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
        globalDatabase.db.search(
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
            globalLog.err(err);
            this.resetTable();
            });
    }

    setTable(docs=[]) {
        globalTable.fill(docs);
    }

        structParse( struct ) {
                return struct
                .filter( e=>!(['date','image'].includes(e.type)))
                .map(e=>{
                        const name=e.name;
                        const alias=e?.alias??name;
                        if ( ['array','image_array'].includes(e.type) ) {
                                return this.structParse(e.members)
                                .map(o=>({name:[name,o.name].join("."),alias:[alias,o.alias].join(".")})) ;
                        } else {
                                return ({name:name,alias:alias});
                        }
                        })
                .flat();
        }
        
        structFields( struct ) {
                const sP = this.structParse( struct ) ;
                sP.forEach( o => this.field_alias[o.name]=o.alias );
                return sP.map( o => o.name ) ;
        }
}

// Set up text search
globalSearch = new Search();

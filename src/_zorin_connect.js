'use strict';

const Gio = imports.gi.Gio;
const GIRepository = imports.gi.GIRepository;
const GLib = imports.gi.GLib;


/**
 * String.format API supporting %s, %d, %x and %f. Used exclusively for gettext.
 * See: https://github.com/GNOME/gjs/blob/master/modules/format.js
 */
String.prototype.format = imports.format.format;


/**
 * Application Variables
 */
zorin_connect.app_id = 'org.gnome.Shell.Extensions.ZorinConnect';
zorin_connect.app_path = '/org/gnome/Shell/Extensions/ZorinConnect';
zorin_connect.is_local = zorin_connect.extdatadir.startsWith(GLib.get_user_data_dir());
zorin_connect.metadata = (() => {
    let data = GLib.file_get_contents(zorin_connect.extdatadir + '/metadata.json')[1];

    if (data instanceof Uint8Array) {
        data = imports.byteArray.toString(data);
    }

    return JSON.parse(data);
})();


/**
 * User Directories
 */
zorin_connect.cachedir = GLib.build_filenamev([GLib.get_user_cache_dir(), 'zorin-connect']);
zorin_connect.configdir = GLib.build_filenamev([GLib.get_user_config_dir(), 'zorin-connect']);
zorin_connect.runtimedir = GLib.build_filenamev([GLib.get_user_runtime_dir(), 'zorin-connect']);

for (let path of [zorin_connect.cachedir, zorin_connect.configdir, zorin_connect.runtimedir]) {
    GLib.mkdir_with_parents(path, 448);
}

/**
 * Setup global object for user or system install
 */
if (zorin_connect.is_local) {
    // Infer libdir by assuming gnome-shell shares a common prefix with gjs
    zorin_connect.libdir = GIRepository.Repository.get_search_path().find(path => {
        return path.endsWith('/gjs/girepository-1.0');
    }).replace('/gjs/girepository-1.0', '');

    // localedir will be a subdirectory of the extension root
    zorin_connect.localedir = GLib.build_filenamev([
        zorin_connect.extdatadir,
        'locale'
    ]);

    // schemadir will be a subdirectory of the extension root
    zorin_connect.gschema = Gio.SettingsSchemaSource.new_from_directory(
        GLib.build_filenamev([zorin_connect.extdatadir, 'schemas']),
        Gio.SettingsSchemaSource.get_default(),
        false
    );
} else {
    let gvc_typelib = GLib.build_filenamev([
        zorin_connect.metadata.libdir,
        'gnome-shell',
        'Gvc-1.0.typelib'
    ]);

    // Check for the Gvc TypeLib to verify the defined libdir
    if (GLib.file_test(gvc_typelib, GLib.FileTest.EXISTS)) {
        zorin_connect.libdir = zorin_connect.metadata.libdir;
    // Fallback to assuming a common prefix with GJS
    } else {
        let searchPath = GIRepository.Repository.get_search_path();
        zorin_connect.libdir = searchPath.find(path => {
            return path.endsWith('/gjs/girepository-1.0');
        }).replace('/gjs/girepository-1.0', '');
    }

    // These two should be populated by meson for this system at build time
    zorin_connect.localedir = zorin_connect.metadata.localedir;
    zorin_connect.gschema = Gio.SettingsSchemaSource.new_from_directory(
        zorin_connect.metadata.gschemadir,
        Gio.SettingsSchemaSource.get_default(),
        false
    );
}


/**
 * Init Gettext
 *
 * If we aren't inside the GNOME Shell process we'll set gettext functions on
 * the global object, otherwise we'll set them on the global 'zorin-connect' object
 */
imports.gettext.bindtextdomain(zorin_connect.app_id, zorin_connect.localedir);
const Gettext = imports.gettext.domain(zorin_connect.app_id);

if (typeof _ !== 'function') {
    window._ = Gettext.gettext;
    window.ngettext = Gettext.ngettext;
    window.C_ = Gettext.pgettext;
    window.N_ = (s) => s;
} else {
    zorin_connect._ = Gettext.gettext;
    zorin_connect.ngettext = Gettext.ngettext;
    zorin_connect.C_ = Gettext.pgettext;
    zorin_connect.N_ = (s) => s;
}


/**
 * Init GSettings
 */
zorin_connect.settings = new Gio.Settings({
    settings_schema: zorin_connect.gschema.lookup(zorin_connect.app_id, true)
});


/**
 * Register resources
 */
Gio.Resource.load(
    GLib.build_filenamev([zorin_connect.extdatadir, `${zorin_connect.app_id}.gresource`])
)._register();

zorin_connect.get_resource = function(rel_path) {
    let array = Gio.resources_lookup_data(
        GLib.build_filenamev([zorin_connect.app_path, rel_path]),
        Gio.ResourceLookupFlags.NONE
    ).toArray();

    if (array instanceof Uint8Array) {
        array = imports.byteArray.toString(array);
    } else {
        array = array.toString();
    }

    return array.replace('@EXTDATADIR@', zorin_connect.extdatadir);
};


/**
 * DBus Interface Introspection
 */
zorin_connect.dbusinfo = Gio.DBusNodeInfo.new_for_xml(
    zorin_connect.get_resource(`${zorin_connect.app_id}.xml`)
);
zorin_connect.dbusinfo.nodes.forEach(info => info.cache_build());


/**
 * Install desktop files for user installs
 */
zorin_connect.installService = function() {
    let confDir = GLib.get_user_config_dir();
    let dataDir = GLib.get_user_data_dir();
    let homeDir = GLib.get_home_dir();

    // DBus Service
    let dbusDir = GLib.build_filenamev([dataDir, 'dbus-1', 'services']);
    let dbusFile = `${zorin_connect.app_id}.service`;

    // Desktop Entry
    let desktopDir = GLib.build_filenamev([dataDir, 'applications']);
    let desktopFile = `${zorin_connect.app_id}.desktop`;

    // Application Icon
    let iconDir = GLib.build_filenamev([dataDir, 'icons', 'hicolor', 'scalable', 'apps']);
    let iconFull = `${zorin_connect.app_id}.svg`;
    let iconSym = `${zorin_connect.app_id}-symbolic.svg`;

    // File Manager Extensions
    let fileManagers = [
        [dataDir + '/nautilus-python/extensions', 'nautilus-zorin-connect.py'],
        [dataDir + '/nemo-python/extensions', 'nemo-zorin-connect.py']
    ];

    // WebExtension Manifests
    let manifestFile = 'org.gnome.shell.extensions.zorin_connect.json';
    let chrome = zorin_connect.get_resource(`${manifestFile}-chrome`);
    let mozilla = zorin_connect.get_resource(`${manifestFile}-mozilla`);
    let manifests = [
        [confDir + '/chromium/NativeMessagingHosts/', chrome],
        [confDir + '/google-chrome/NativeMessagingHosts/', chrome],
        [confDir + '/google-chrome-beta/NativeMessagingHosts/', chrome],
        [confDir + '/google-chrome-unstable/NativeMessagingHosts/', chrome],
        [confDir + '/BraveSoftware/Brave-Browser/NativeMessagingHosts/', chrome],
        [homeDir + '/.mozilla/native-messaging-hosts/', mozilla]
    ];

    // If running as a user extension, ensure the DBus service, desktop entry,
    // file manager scripts, and WebExtension manifests are installed.
    if (zorin_connect.is_local) {
        // DBus Service
        GLib.mkdir_with_parents(dbusDir, 493);  // 0755 in octal
        GLib.file_set_contents(
            GLib.build_filenamev([dbusDir, dbusFile]),
            zorin_connect.get_resource(dbusFile)
        );

        // Desktop Entry
        GLib.mkdir_with_parents(desktopDir, 493);
        GLib.file_set_contents(
            GLib.build_filenamev([desktopDir, desktopFile]),
            zorin_connect.get_resource(desktopFile)
        );

        // Application Icon
        GLib.mkdir_with_parents(iconDir, 493);
        GLib.file_set_contents(
            GLib.build_filenamev([iconDir, iconFull]),
            zorin_connect.get_resource(`icons/${iconFull}`)
        );
        GLib.file_set_contents(
            GLib.build_filenamev([iconDir, iconSym]),
            zorin_connect.get_resource(`icons/${iconSym}`)
        );

        // File Manager Extensions
        for (let [dir, name] of fileManagers) {
            let script = Gio.File.new_for_path(GLib.build_filenamev([dir, name]));
            if (!script.query_exists(null)) {
                GLib.mkdir_with_parents(dir, 493);
                script.make_symbolic_link(
                    zorin_connect.extdatadir + '/nautilus-zorin-connect.py',
                    null
                );
            }
        }

        // WebExtension Manifests
        for (let [dir, manifest] of manifests) {
            GLib.mkdir_with_parents(dir, 493);
            GLib.file_set_contents(
                GLib.build_filenamev([dir, manifestFile]),
                manifest
            );
        }

    // Otherwise, if running as a system extension, ensure anything previously
    // installed when running as a user extension is removed.
    } else {
        GLib.unlink(GLib.build_filenamev([dbusDir, dbusFile]));
        GLib.unlink(GLib.build_filenamev([desktopDir, desktopFile]));
        GLib.unlink(GLib.build_filenamev([iconDir, iconFull]));
        GLib.unlink(GLib.build_filenamev([iconDir, iconSym]));

        for (let [dir, name] of fileManagers) {
            GLib.unlink(GLib.build_filenamev([dir, name]));
        }

        for (let dir of Object.keys(manifests)) {
            GLib.unlink(GLib.build_filenamev([dir, manifestFile]));
        }
    }
};

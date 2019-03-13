'use strict';

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;

// Find the root datadir of the extension
function get_datadir() {
    let m = /@(.+):\d+/.exec((new Error()).stack.split('\n')[1]);
    return Gio.File.new_for_path(m[1]).get_parent().get_path();
}

// Local Imports
window.zorin_connect = {extdatadir: get_datadir()};
imports.searchPath.unshift(zorin_connect.extdatadir);
imports._zorin_connect;


function init() {
    zorin_connect.installService();
    Gtk.IconTheme.get_default().add_resource_path(zorin_connect.app_path);
}

function buildPrefsWidget() {
    let label = new Gtk.Label();
    GLib.timeout_add(GLib.PRIORITY_DEFAULT, 0, () => {
        label.get_toplevel().destroy();
        return false;
    });

    let service = Gio.DBusActionGroup.get(
        Gio.DBus.session,
        'org.gnome.Shell.Extensions.ZorinConnect',
        '/org/gnome/Shell/Extensions/ZorinConnect'
    );
    service.list_actions();
    service.activate_action('settings', null);

    return label;
}


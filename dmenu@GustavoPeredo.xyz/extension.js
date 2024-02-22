/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import GObject from 'gi://GObject';
import St from 'gi://St';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

import Clutter from 'gi://Clutter'

import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as AnimationUtils from 'resource:///org/gnome/shell/misc/animationUtils.js';
import * as Dialog from 'resource:///org/gnome/shell/ui/dialog.js';

import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

// Setup our Server Actions
const paramAction = new Gio.SimpleAction({
    name: 'paramAction',
    parameter_type: new GLib.VariantType('as'),
});
const stateAction = new Gio.SimpleAction({
    name: 'stateAction',
    state: GLib.Variant.new_string(''),
});
const actionGroup = new Gio.SimpleActionGroup();
actionGroup.add_action(paramAction);
actionGroup.add_action(stateAction);

function change_action_state_wrap(state) {
    // Get the action state
    let actionState = actionGroup.get_action_state('stateAction').unpack();

    if (state == actionState && state == '') {
        state = ' ';
    }

    actionGroup.change_action_state('stateAction', new GLib.Variant('s', state));

}
//This class is only used in testing 
const Indicator = GObject.registerClass(
class Indicator extends PanelMenu.Button {
    _init() {
        super._init(0.0, _('My Shiny Indicator'));

        this.add_child(new St.Icon({
            icon_name: 'face-smile-symbolic',
            style_class: 'system-status-icon',
        }));

        const remoteGroup = Gio.DBusActionGroup.get(
                Gio.DBus.session,
                'org.gnome.Shell',
                '/xyz/GustavoPeredo/DynamicMenu');


        remoteGroup.connect('action-state-changed', (group, actionName, state) => {
            Main.notify(`${actionName} is now has the state ${state.unpack()}!`);
        });


        remoteGroup.list_actions();
        
        let item = new PopupMenu.PopupMenuItem(_('Show Notification'));
        item.connect('activate', () => {
            remoteGroup.activate_action('paramAction', new GLib.Variant('as', ["Tasks: ", `Task One
Task Two
Task Three
Task Four
Task Five
Task Six
Task Seven
Task Eight
Task Nine
Task Ten
Task Eleven
Task Twelve
Task Thirteen
Task Fourteen
Task Fifteen
Task Sixteen
Task Seventeen
Task Eighteen
Task Nineteen
Task Twenty`]));
        });
        this.menu.addMenuItem(item);
    }
});


const InputDialog = GObject.registerClass(
class InputDialog extends St.Entry {
    _init() {
        super._init();

        this.get_tasks = () => {};

        // Signal handler for when the user presses Enter or clicks outside the dialog
        this.clutter_text.connect('activate', (actor) => {
            change_action_state_wrap(this.get_text());
            this.close(true);
        });
        this.clutter_text.connect('key-press-event', (actor, event) => {
            if (event.get_key_symbol() === Clutter.KEY_Escape) {
                this.close();
                return Clutter.EVENT_STOP;
            } else if (event.get_key_symbol() === Clutter.KEY_Down) {
                // Move focus to the MyWidget first item
                const [firstTask, index] = this.get_tasks().selectFirstVisibleTask();
                firstTask.grab_key_focus();
                this.get_tasks().updateSelectIndex(index);
                return Clutter.EVENT_STOP;
            } else if (event.get_key_symbol() === Clutter.KEY_Tab) {
                const [firstTask, _index] = this.get_tasks().selectFirstVisibleTask();
                this.set_text(firstTask.get_first_child().get_text());
                return Clutter.EVENT_STOP;
            } else if (event.get_key_symbol() === Clutter.KEY_Return) {
                change_action_state_wrap(this.get_text());
                this.close(true);
                return Clutter.EVENT_STOP;
            }


            return Clutter.EVENT_PROPAGATE;
        });

        this.clutter_text.connect('text-changed', (actor) => {
            this.get_tasks().filter(actor.get_text());
        });

    }

    close() {
        this.destroy();
    }
})


const KeyboardDrivenListWidget = GObject.registerClass(
    class KeyboardDrivenListWidget extends St.Widget {
        _init(entry_widget) {
            super._init({
                layout_manager: new Clutter.BoxLayout({ orientation: Clutter.Orientation.VERTICAL }),
                //vertical: true,
                reactive: true,
                can_focus: true,
                track_hover: true,
                x_expand: true,
                y_expand: true,
                x_align: Clutter.ActorAlign.FILL,
                y_align: Clutter.ActorAlign.FILL,
                clip_to_allocation: true,
            });

            this._list = new St.BoxLayout({
                reactive: true,
                can_focus: true,
                track_hover: true,
                x_expand: true,
                y_expand: true,
                vertical: true,
                style_class: 'keyboard-driven-list-widget',
                clip_to_allocation: true,
            });

            this._tasks = [];


            /* Add a scroll view once it's working 
            
            this.scrollView = new St.ScrollView({
                hscrollbar_policy: St.PolicyType.NEVER,
                vscrollbar_policy: St.PolicyType.ALWAYS,
                x_expand: true,
                y_expand: true,
                x_align: Clutter.ActorAlign.FILL,
                y_align: Clutter.ActorAlign.FILL,
                child: this._list,
            }); */


            // Set initial focus
            this._selectedIndex = 0;

            // Connect key events
            this.connect('key-press-event', (_, event) => {
                if (event.get_key_symbol() === Clutter.KEY_Up) {
                    // Handle up arrow key
                    this._moveSelection(-1);
                    return Clutter.EVENT_STOP;
                } else if (event.get_key_symbol() === Clutter.KEY_Down) {
                    // Handle down arrow key
                    this._moveSelection(1);
                    return Clutter.EVENT_STOP;
                } else if (event.get_key_symbol() === Clutter.KEY_Tab) {
                    // Update the entry_widget text to the selected task
                    const selectedTask = this._tasks[this._selectedIndex];
                    if (selectedTask) {
                        entry_widget.set_text(selectedTask.get_first_child().get_text());
                    }
                    return Clutter.EVENT_STOP;
                } else if (event.get_key_symbol() === Clutter.KEY_Return) {
                    change_action_state_wrap(
                        this._tasks[this._selectedIndex].get_first_child().get_text()
                    );
                    this.close(true);
                    return Clutter.EVENT_STOP;
                }
                return Clutter.EVENT_PROPAGATE;
            });

            // Update the entry_widget functions
            this.entry_widget = entry_widget;

            entry_widget.get_tasks = () => {
                return this;
            }
            
        }

        addTask(title) {
            const task = new St.Widget({
                reactive: true,
                can_focus: true,
                track_hover: true,
                clip_to_allocation: true,
                style_class: 'task',
                visible: true, // Initially all tasks are visible
            });

            const titleLabel = new St.Label({ text: title });
            task.add_child(titleLabel);

            task.connect('button-press-event', () => {
                this._selectedIndex = this._list.get_children().indexOf(task);
                this._updateSelection();
            });

            this._tasks.push(task); // Add task to tasks array
            this._list.add_child(task);
        }

        _moveSelection(direction) {
            const children = this._list.get_children();
            if (children.length === 0) return;

            let newIndex = this._selectedIndex + direction;

            // Find the next visible index in the specified direction
            while (newIndex >= 0 && newIndex < children.length) {
                const child = children[newIndex];
                if (child.visible) {
                    this._selectedIndex = newIndex;
                    this._updateSelection();
                    return;
                }
                newIndex += direction;
            }

            // If no visible index is found, select the text entry
            this._selectedIndex = -1;
            this._updateSelection();
            this.entry_widget.grab_key_focus();

        }

        _updateSelection() {
            const children = this._list.get_children();
            children.forEach((child, index) => {
                if (index === this._selectedIndex) {
                    child.add_style_class_name('selected');
                    // ScrollView: AnimationUtils.ensureActorVisibleInScrollView(this.scrollView, child);
                    child.grab_key_focus();
                } else {
                    child.remove_style_class_name('selected');
                }
            });
        }

        // Function to filter tasks based on query
        filter(query) {
            this._tasks.forEach(task => {
                if (query === "") {
                    task.show()
                } else {
                    const title = task.get_first_child().get_text(); // Get task title
                    if (title.includes(query)) {
                        task.show()
                    } else {
                        task.hide()
                    }
                }
            });
        }

        // Function to select the first visible task
        selectFirstVisibleTask() {
            for (let i = 0; i < this._tasks.length; i++) {
                if (this._tasks[i].visible) {
                    return [this._tasks[i], i];
                }
            }
        }

        updateSelectIndex(index) {
            this._selectedIndex = index;
            this._updateSelection();
        }
    }
);



export default class IndicatorExampleExtension extends Extension {
    enable() {
        paramAction.connect('activate', (action, parameter) => {
            const [title, state] = parameter.deep_unpack();
            const dialogLayout = new Dialog.Dialog(global.stage, 'my-dialog');
            dialogLayout._dialog.set_x_expand(true);
            dialogLayout.set_x_expand(true);
            dialogLayout.set_x_align(Clutter.ActorAlign.FILL);

            const monitor = global.display.get_monitor_geometry(
                global.display.get_current_monitor()
            );
            const widgetWidth = Math.floor(monitor.width / 3);
            const yPosition = Math.floor(monitor.height / 2);

            dialogLayout.set_size(widgetWidth, 300);
            dialogLayout.contentLayout.set_size(widgetWidth, -1);
            dialogLayout.set_position(widgetWidth, yPosition - 48);

            const label = new St.Label({ 
                text: title,
                style_class: 'h2',
            });
            dialogLayout.contentLayout.add_child(label);

            const entry = new InputDialog();

            const close = (closed) => {
                if (!closed) {
                    change_action_state_wrap('');
                }
                dialogLayout.destroy();
            }

            entry.close = close;
            dialogLayout.contentLayout.add_child(entry);



            const listWidget = new KeyboardDrivenListWidget(entry);
            //listWidget.add_child(listWidget.scrollView);
            listWidget.add_child(listWidget._list);
            listWidget._list.set_height(200);

            const lines = state.split("\n");
            lines.forEach((line) => {
                listWidget.addTask(line);
            });
            dialogLayout.contentLayout.add_child(listWidget);




            listWidget.close = close;

            entry.grab_key_focus();
        });

        this.connection = Gio.DBus.session;
        this.groupId = this.connection.export_action_group('/xyz/GustavoPeredo/DynamicMenu',
            actionGroup);

        this._indicator = new Indicator();
        Main.panel.addToStatusArea(this.uuid, this._indicator);
    }

    disable() {
        this._indicator.destroy();
        this._indicator = null;
        this.connection.unexport_action_group(this.groupId);
    }
}

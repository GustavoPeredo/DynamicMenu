use clap::Parser;
use gio::prelude::*;
use gio::{ DBusActionGroup, Application };
use std::io::{self, Read };
use std::sync::{Arc, Mutex, Condvar};
use std::thread::sleep;

#[derive(Parser)]
#[command(version, about, long_about = None)]
struct Args {
    /// Name of the person to greet
    #[arg(short = 'p', long, default_value = "dmenu:")]
    title: String,

}

fn init_group() -> DBusActionGroup {
    let bus = gio::functions::bus_get_sync(
        gio::BusType::Session,
        None::<&gio::Cancellable>
    ).unwrap();
    let remote_group = DBusActionGroup::get(
        &bus, //&app.dbus_connection().unwrap(),
        Some("org.gnome.Shell"),
        "/xyz/GustavoPeredo/DynamicMenu",
    );
    remote_group
}

fn main_thread(app: &Application) {
    let matches = Args::parse();
    let title = matches.title;

    let bus = gio::functions::bus_get_sync(
        gio::BusType::Session,
        None::<&gio::Cancellable>
    ).unwrap();
    let remote_group = init_group();
        sleep(std::time::Duration::from_secs(1));
        remote_group.list_actions();
sleep(std::time::Duration::from_secs(1));
        remote_group.list_actions();
sleep(std::time::Duration::from_secs(1));
        remote_group.list_actions();
sleep(std::time::Duration::from_secs(1));
        remote_group.list_actions();
    remote_group.
        change_action_state("stateAction", &"custom2".to_variant());
    

    let variant = vec![title, read_from_stdin()].to_variant();
    remote_group
        .activate_action("paramAction", Some(&variant));

    
    


    let condvar = Arc::new((Mutex::new(false), Condvar::new()));
    let condvar_call = Arc::clone(&condvar);

    remote_group.activate_action("stateAction", Some(&"".to_variant()));
    remote_group.
        change_action_state("stateAction", &"custom2".to_variant());



    println!("{:?} {:?} {:?}",
        remote_group.is_action_enabled("paramAction"),
        remote_group.is_action_enabled("stateAction"),
        remote_group.list_actions()
    );

    remote_group
        .connect_action_added(None,
            |_,_| {
                println!("action-added");
            }
        );

    remote_group
        .connect_action_removed(None, 
            |_,_| {
                println!("action-removed");
            }
        );

        sleep(std::time::Duration::from_secs(1));

    println!("{:?} {:?} {:?}",
        remote_group.has_action("paramAction"),
        remote_group.has_action("stateAction"),
        remote_group.list_actions()
    );

    remote_group.
        change_action_state("stateAction", &"custom".to_variant());

    println!("{:?} {:?} {:?}",
        remote_group.has_action("paramAction"),
        remote_group.has_action("stateAction"),
        remote_group.list_actions()
    );
    
    remote_group
        .connect_action_state_changed(None,
            move |_group, _action, state| {
                println!("action-state-changed: {:?}", state);
                let (lock, cvar) = &*condvar_call;
                let mut done = lock.lock().unwrap();
                *done = true;
                cvar.notify_one();
            }
        );
    remote_group.
        change_action_state("stateAction", &"custom2".to_variant());

    println!("{:?} {:?} {:?}",
        remote_group.has_action("paramAction"),
        remote_group.has_action("stateAction"),
        remote_group.list_actions()
    );

    

    println!("{:?} {:?} {:?}",
        remote_group.has_action("paramAction"),
        remote_group.has_action("stateAction"),
        remote_group.list_actions()
    );
    

    let (lock, cvar) = &*condvar;
    let mut done = lock.lock().unwrap();
    while !*done {
        loop {
        println!("{:?} {:?} {:?}",
        remote_group.has_action("paramAction"),
        remote_group.has_action("stateAction"),
        remote_group.list_actions()
        );


        sleep(std::time::Duration::from_secs(1));

    }
        done = cvar.wait(done).unwrap();
    }
}


fn main() -> glib::ExitCode {

    let app = Application::new(
        Some("xyz.GustavoPeredo.DynamicMenu"),
        gio::ApplicationFlags::FLAGS_NONE,
    );

    app.connect_activate(main_thread);

    app.run()
}

fn read_from_stdin() -> String {
    let stdin = io::stdin();
    let mut buffer = String::new();
    if atty::is(atty::Stream::Stdin) {
        return buffer;
    }
    stdin.lock().read_to_string(&mut buffer).unwrap();
    buffer
}
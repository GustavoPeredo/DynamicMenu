use gio::prelude::*;
use glib::{Variant, DBus};
use clap::{App, Arg};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let matches = App::new("dmenu")
                         .arg(Arg::with_name("title")
                                   .long("p")
                                   .takes_value(true))
                         .get_matches();

    let title = matches.value_of("title").unwrap_or("Default Title");

    // Connect to the org.gnome.Shell D-Bus service
    let shell = DBus::session().connection().get_object("org.gnome.Shell")?;
    let mut remote_group = shell.get_object("xyzactiongroup")?;

    // Set up the action group
    remote_group.set_name("My Dynamic Menu");
    remote_group.set_description("A dynamic menu with tasks.");

    // Define the actions
    let param_action = remote_group.add_action("paramAction", Variant::new("as", vec![]));

    // Read input from standard input
    let mut input = String::new();
    std::io::stdin().read_line(&mut input)?;

    // Split the input into lines
    let lines = input.split('\n').filter(|line| !line.is_empty()).map(|line| line.to_string());

    // Create a variant containing the list of tasks
    let tasks = Variant::new("av", lines.collect::<Vec<String>>());

    // Activate the parameterized action
    remote_group.activate_action("paramAction", &tasks)?;

    // Wait for the "action-state-changed" signal
    let main_context = glib::MainContext::default();
    let _source_id = remote_group.connect_local("action-state-changed", false, move |_, action_name, state| {
        println!("{} is now {}", action_name, state.unpack());
        // Add code here to close the application if needed
        // For example:
        // std::process::exit(0);
        glib::Continue(true)
    })?;

    // Run the main loop
    main_context.iterate(None, true)?;

    Ok(())
}

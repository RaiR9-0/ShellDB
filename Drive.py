import tkinter as tk
import LoginApp
import ConectionDB

if __name__ == "__main__":
    # Initialize MongoDB connection
    db_manager = ConectionDB.MongoDBManager()
    
    # Setup activation codes if they don't exist
    ConectionDB.setup_activation_codes(db_manager)
    
    # Run the login application
    LoginApp.run_login(db_manager)

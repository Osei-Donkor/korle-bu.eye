CREATE DATABASE IF NOT EXISTS healthcare;
USE healthcare;
CREATE TABLE users ( id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100), email VARCHAR(150) UNIQUE, password VARCHAR(255), role ENUM('admin','doctor','patient'), phone VARCHAR(50), age INT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP );
CREATE TABLE appointments ( id INT AUTO_INCREMENT PRIMARY KEY, patient_id INT, doctor_id INT, date DATE, time TIME, status ENUM('pending','approved','completed') DEFAULT 'pending', reason TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE );
CREATE TABLE doctor_patient ( id INT AUTO_INCREMENT PRIMARY KEY, doctor_id INT, patient_id INT, FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE );

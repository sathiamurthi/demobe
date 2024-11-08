-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 26, 2024 at 11:29 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

DROP SCHEMA IF EXISTS `timesheet`;
CREATE SCHEMA `timesheet`;
USE `timesheet`;

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

 /*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
 /*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
 /*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
 /*!40101 SET NAMES utf8mb4 */;

--
-- Database: `timesheet`
--

-- --------------------------------------------------------

--
-- Table structure for table `resource`
--

CREATE TABLE `resource` (
  `ResourceID` CHAR(36) NOT NULL,
  `Email` VARCHAR(255) NOT NULL,
  `Name` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`ResourceID`),
  UNIQUE KEY `Email` (`Email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `resource`
--

INSERT INTO `resource` (`ResourceID`, `Email`, `Name`) VALUES
('c1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6', 'uday.kumar@innoverdigital.com', 'Uday Kumar'),
('d1e2f3g4-h5i6-j7k8-l9m0-n1o2p3q4r5s6', 'employee2@innoverdigital.com', 'Employee Two');

-- --------------------------------------------------------

--
-- Table structure for table `project`
--

CREATE TABLE `project` (
  `ProjectID` CHAR(36) NOT NULL,
  `Name` VARCHAR(255) NOT NULL,
  `StartDate` DATE DEFAULT NULL,
  `EndDate` DATE DEFAULT NULL,
  `Status` INT DEFAULT NULL,
  `TotalHours` INT DEFAULT NULL,
  PRIMARY KEY (`ProjectID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `project`
--

INSERT INTO `project` (`ProjectID`, `Name`, `StartDate`, `EndDate`, `Status`, `TotalHours`) VALUES
('0abe81d9-7991-11ef-acab-bceca049a38e', 'frontierxyz', '2024-05-02', '2024-06-08', 0, 0),
('101e8d0f-3e6d-4a53-b8a6-6b9be0e3f49d', 'Timesheet App Project', '2024-08-01', '2024-10-09', 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `manager`
--

CREATE TABLE `manager` (
  `ManagerID` CHAR(36) NOT NULL,
  `Email` VARCHAR(255) NOT NULL,
  `Name` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`ManagerID`),
  UNIQUE KEY `Email` (`Email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `manager`
--

INSERT INTO `manager` (`ManagerID`, `Email`, `Name`) VALUES
('1e8d0f3e-3e6d-4a53-b8a6-6b9be0e3f49d', 'uday.kumar@innoverdigital.com', 'Uday Kumar');

-- --------------------------------------------------------

--
-- Table structure for table `managerprojects`
--

CREATE TABLE `managerprojects` (
  `ManagerID` CHAR(36) NOT NULL,
  `ProjectID` CHAR(36) NOT NULL,
  PRIMARY KEY (`ManagerID`, `ProjectID`),
  KEY `ProjectID` (`ProjectID`),
  CONSTRAINT `managerprojects_ibfk_1` FOREIGN KEY (`ManagerID`) REFERENCES `manager` (`ManagerID`),
  CONSTRAINT `managerprojects_ibfk_2` FOREIGN KEY (`ProjectID`) REFERENCES `project` (`ProjectID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `managerprojects`
--

INSERT INTO `managerprojects` (`ManagerID`, `ProjectID`) VALUES
('1e8d0f3e-3e6d-4a53-b8a6-6b9be0e3f49d', '0abe81d9-7991-11ef-acab-bceca049a38e'),
('1e8d0f3e-3e6d-4a53-b8a6-6b9be0e3f49d', '101e8d0f-3e6d-4a53-b8a6-6b9be0e3f49d');

-- --------------------------------------------------------

--
-- Table structure for table `resourceprojects`
--

-- Disable foreign key checks to allow for truncation and new entries
SET FOREIGN_KEY_CHECKS = 0;

-- Drop the `resourceprojects` table if it exists to recreate it with new structure
DROP TABLE IF EXISTS `resourceprojects`;

-- Create the new `resourceprojects` table
CREATE TABLE `resourceprojects` (
  `ResourceID` CHAR(36) NOT NULL,                  -- EmployeeID from `Allocations` table
  `ProjectID` CHAR(36) NOT NULL,                   -- ProjectID from `Allocations` table
  `Status` INT DEFAULT NULL,                       -- Status placeholder (optional)
  `TotalHours` INT DEFAULT NULL,                   -- Total hours placeholder (optional)
  `Comments` VARCHAR(255) DEFAULT NULL,            -- Default comments field
  `AssignedHours` INT DEFAULT NULL,                -- Mapped AssignedHours based on AllocationPercent
  PRIMARY KEY (`ResourceID`, `ProjectID`),         -- Set combination of ResourceID and ProjectID as primary key
  KEY `ProjectID` (`ProjectID`),                   -- Create index on ProjectID
  CONSTRAINT `resourceprojects_ibfk_1` FOREIGN KEY (`ResourceID`) REFERENCES `resource` (`ResourceID`),
  CONSTRAINT `resourceprojects_ibfk_2` FOREIGN KEY (`ProjectID`) REFERENCES `project` (`ProjectID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;
--
-- Dumping data for table `resourceprojects`
--

INSERT INTO `resourceprojects` (`ResourceID`, `ProjectID`, `Status`, `TotalHours`, `Comments`,`AssignedHours`) VALUES
('c1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6', '0abe81d9-7991-11ef-acab-bceca049a38e', 0, 0, NULL, 0),
('c1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6', '101e8d0f-3e6d-4a53-b8a6-6b9be0e3f49d', 0, 0, NULL, 0);

-- --------------------------------------------------------

--
-- Table structure for table `daily_hours`
--

CREATE TABLE `daily_hours` (
  `ID` INT NOT NULL AUTO_INCREMENT,
  `ResourceID` VARCHAR(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `ProjectID` VARCHAR(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `EntryDate` DATE DEFAULT NULL,
  `Hours` INT DEFAULT NULL,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `Unique_Resource_Project_Date` (`ResourceID`, `ProjectID`, `EntryDate`),
  KEY `ResourceID` (`ResourceID`),
  KEY `ProjectID` (`ProjectID`),
  CONSTRAINT `daily_hours_ibfk_1` FOREIGN KEY (`ResourceID`) REFERENCES `resource` (`ResourceID`),
  CONSTRAINT `daily_hours_ibfk_2` FOREIGN KEY (`ProjectID`) REFERENCES `project` (`ProjectID`)
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `daily_hours`
--

INSERT INTO `daily_hours` (`ID`, `ResourceID`, `ProjectID`, `EntryDate`, `Hours`) VALUES
-- Records for Project 'frontierxyz' from 2024-05-02 to 2024-06-08
(1, 'c1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6', '0abe81d9-7991-11ef-acab-bceca049a38e', '2024-05-02', NULL),
(2, 'c1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6', '0abe81d9-7991-11ef-acab-bceca049a38e', '2024-05-03', NULL);

-- --------------------------------------------------------

--
-- AUTO_INCREMENT for dumped tables
--

-- (Only `daily_hours` has AUTO_INCREMENT set during creation)

--
-- Constraints for dumped tables
--

-- (All constraints are already defined within CREATE TABLE statements)

COMMIT;

 /*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
 /*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
 /*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

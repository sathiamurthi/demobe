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
-- Table structure for table `daily_hours`
--

CREATE TABLE `daily_hours` (
  `ID` int(11) NOT NULL,
  `ResourceID` varchar(36) NOT NULL,
  `ProjectID` varchar(36) NOT NULL,
  `Date` Date DEFAULT NULL,
  `Hours` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `daily_hours`
--

INSERT INTO `daily_hours` (`ID`, `ResourceID`, `ProjectID`, `Date`, `Hours`) VALUES
-- Records for Project 'frontierxyz' from 05/02/2024 to 06/08/2024
(1, 'c1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6', '0abe81d9-7991-11ef-acab-bceca049a38e', '05/02/2024', NULL),
(2, 'c1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6', '0abe81d9-7991-11ef-acab-bceca049a38e', '05/03/2024', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `manager`
--

CREATE TABLE `manager` (
  `ManagerID` char(36) NOT NULL,
  `Email` varchar(255) NOT NULL,
  `Name` varchar(255) NOT NULL
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
  `ManagerID` char(36) NOT NULL,
  `ProjectID` char(36) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `managerprojects`
--

INSERT INTO `managerprojects` (`ManagerID`, `ProjectID`) VALUES
('1e8d0f3e-3e6d-4a53-b8a6-6b9be0e3f49d', '0abe81d9-7991-11ef-acab-bceca049a38e'),
('1e8d0f3e-3e6d-4a53-b8a6-6b9be0e3f49d', '101e8d0f-3e6d-4a53-b8a6-6b9be0e3f49d');

-- --------------------------------------------------------

--
-- Table structure for table `project`
--

CREATE TABLE `project` (
  `ProjectID` char(36) NOT NULL,
  `Name` varchar(255) NOT NULL,
  `StartDate` Date DEFAULT NULL,
  `EndDate` Date DEFAULT NULL,
  `Status` int(11) DEFAULT NULL,
  `TotalHours` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `project`
--

INSERT INTO `project` (`ProjectID`, `Name`, `StartDate`, `EndDate`, `Status`, `TotalHours`) VALUES
('0abe81d9-7991-11ef-acab-bceca049a38e', 'frontierxyz', '2024-05-02', '2024-06-08', 0, 0),
('101e8d0f-3e6d-4a53-b8a6-6b9be0e3f49d', 'Timesheet App Project', '2024-08-01', '2024-10-09', 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `resource`
--

CREATE TABLE `resource` (
  `ResourceID` char(36) NOT NULL,
  `Email` varchar(255) NOT NULL,
  `Name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `resource`
--

INSERT INTO `resource` (`ResourceID`, `Email`, `Name`) VALUES
('c1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6', 'uday.kumar@innoverdigital.com', 'Uday Kumar'),
('d1e2f3g4-h5i6-j7k8-l9m0-n1o2p3q4r5s6', 'employee2@innoverdigital.com', 'Employee Two');

-- --------------------------------------------------------

--
-- Table structure for table `resourceprojects`
--

CREATE TABLE `resourceprojects` (
  `ResourceID` char(36) NOT NULL,
  `ProjectID` char(36) NOT NULL,
  `Status` int(11) DEFAULT NULL,
  `TotalHours` int(11) DEFAULT NULL,
  `Comments` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `resourceprojects`
--

INSERT INTO `resourceprojects` (`ResourceID`, `ProjectID`, `Status`, `TotalHours`, `Comments`) VALUES
('c1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6', '0abe81d9-7991-11ef-acab-bceca049a38e', 0, 0, NULL),
('c1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6', '101e8d0f-3e6d-4a53-b8a6-6b9be0e3f49d', 0, 0, NULL);

-- --------------------------------------------------------

--
-- Indexes for dumped tables
--

--
-- Indexes for table `daily_hours`
--
ALTER TABLE `daily_hours`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `ResourceID` (`ResourceID`),
  ADD KEY `ProjectID` (`ProjectID`);

--
-- Indexes for table `manager`
--
ALTER TABLE `manager`
  ADD PRIMARY KEY (`ManagerID`),
  ADD UNIQUE KEY `Email` (`Email`);

--
-- Indexes for table `managerprojects`
--
ALTER TABLE `managerprojects`
  ADD PRIMARY KEY (`ManagerID`,`ProjectID`),
  ADD KEY `ProjectID` (`ProjectID`);

--
-- Indexes for table `project`
--
ALTER TABLE `project`
  ADD PRIMARY KEY (`ProjectID`);

--
-- Indexes for table `resource`
--
ALTER TABLE `resource`
  ADD PRIMARY KEY (`ResourceID`),
  ADD UNIQUE KEY `Email` (`Email`);

--
-- Indexes for table `resourceprojects`
--
ALTER TABLE `resourceprojects`
  ADD PRIMARY KEY (`ResourceID`,`ProjectID`),
  ADD KEY `ProjectID` (`ProjectID`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `daily_hours`
--
ALTER TABLE `daily_hours`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `daily_hours`
--
ALTER TABLE `daily_hours`
  ADD CONSTRAINT `daily_hours_ibfk_1` FOREIGN KEY (`ResourceID`) REFERENCES `resource` (`ResourceID`),
  ADD CONSTRAINT `daily_hours_ibfk_2` FOREIGN KEY (`ProjectID`) REFERENCES `project` (`ProjectID`);

--
-- Constraints for table `managerprojects`
--
ALTER TABLE `managerprojects`
  ADD CONSTRAINT `managerprojects_ibfk_1` FOREIGN KEY (`ManagerID`) REFERENCES `manager` (`ManagerID`),
  ADD CONSTRAINT `managerprojects_ibfk_2` FOREIGN KEY (`ProjectID`) REFERENCES `project` (`ProjectID`);

--
-- Constraints for table `resourceprojects`
--
ALTER TABLE `resourceprojects`
  ADD CONSTRAINT `resourceprojects_ibfk_1` FOREIGN KEY (`ResourceID`) REFERENCES `resource` (`ResourceID`),
  ADD CONSTRAINT `resourceprojects_ibfk_2` FOREIGN KEY (`ProjectID`) REFERENCES `project` (`ProjectID`);

--
-- Constraints for table `worked_hours`
--
-- (No `worked_hours` table included as per requirements)




COMMIT;

DROP TABLE IF EXISTS `daily_hours`;

CREATE TABLE `daily_hours` (
  `ID` int NOT NULL AUTO_INCREMENT,
  `ResourceID` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `ProjectID` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `EntryDate` Date DEFAULT NULL,
  `Hours` int DEFAULT NULL,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `Unique_Resource_Project_Date` (`ResourceID`, `ProjectID`, `EntryDate`), -- Adding unique constraint here
  KEY `ResourceID` (`ResourceID`),
  KEY `ProjectID` (`ProjectID`),
  CONSTRAINT `daily_hours_ibfk_1` FOREIGN KEY (`ResourceID`) REFERENCES `resource` (`ResourceID`),
  CONSTRAINT `daily_hours_ibfk_2` FOREIGN KEY (`ProjectID`) REFERENCES `project` (`ProjectID`)
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
 /*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
 /*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

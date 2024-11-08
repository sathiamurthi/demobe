-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 26, 2024 at 11:29 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12
drop schema timesheet;
create schema timesheet;
use timesheet;
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
  `ResourceID` varchar(255) DEFAULT NULL,
  `ProjectID` varchar(255) DEFAULT NULL,
  `Date` varchar(10) DEFAULT NULL,
  `Hours` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `daily_hours`
--

INSERT INTO `daily_hours` (`ID`, `ResourceID`, `ProjectID`, `Date`, `Hours`) VALUES
(19, 'c1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6', '101e8d0f-3e6d-4a53-b8a6-6b9be0e3f49d', '2024-09-02', NULL),
(20, 'c1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6', '101e8d0f-3e6d-4a53-b8a6-6b9be0e3f49d', '2024-09-03', NULL),
(21, 'c1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6', '101e8d0f-3e6d-4a53-b8a6-6b9be0e3f49d', '2024-09-04', NULL),
(22, 'c1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6', '101e8d0f-3e6d-4a53-b8a6-6b9be0e3f49d', '2024-09-05', NULL),
(23, 'c1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6', '202e8d0f-3e6d-4a53-b8a6-6b9be0e3f49d', '2024-09-06', NULL),
(24, 'c1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6', '303e8d0f-3e6d-4a53-b8a6-6b9be0e3f49d', '2024-09-02', NULL),
(25, 'c1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6', '303e8d0f-3e6d-4a53-b8a6-6b9be0e3f49d', '2024-09-03', NULL),
(26, 'c1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6', '303e8d0f-3e6d-4a53-b8a6-6b9be0e3f49d', '2024-09-04', NULL),
(27, 'c1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6', '303e8d0f-3e6d-4a53-b8a6-6b9be0e3f49d', '2024-09-05', NULL),
(28, 'c1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6', '303e8d0f-3e6d-4a53-b8a6-6b9be0e3f49d', '2024-09-06', NULL),
(29, 'c1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6', '303e8d0f-3e6d-4a53-b8a6-6b9be0e3f49d', '2024-09-07', NULL),
(30, 'c1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6', 'ca91795b-7779-11ef-b9e6-bceca049a38e', '2024-09-02', NULL),
(31, 'c1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6', '38b831a8-797a-11ef-acab-bceca049a38e', '2024-09-01', NULL),
(32, 'c1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6', '38b831a8-797a-11ef-acab-bceca049a38e', '2024-09-02', NULL),
(33, 'c1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6', '38b831a8-797a-11ef-acab-bceca049a38e', '2024-09-03', NULL),
(34, 'c1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6', '38b831a8-797a-11ef-acab-bceca049a38e', '2024-09-04', NULL),
(35, 'c1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6', '38b831a8-797a-11ef-acab-bceca049a38e', '2024-09-05', NULL),
(36, 'c1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6', '38b831a8-797a-11ef-acab-bceca049a38e', '2024-09-06', NULL),
(37, 'c1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6', '38b831a8-797a-11ef-acab-bceca049a38e', '2024-09-07', NULL),
(38, 'c1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6', '0abe81d9-7991-11ef-acab-bceca049a38e', '2024-09-01', NULL),
(39, 'c1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6', '0abe81d9-7991-11ef-acab-bceca049a38e', '2024-09-02', NULL),
(40, 'c1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6', '0abe81d9-7991-11ef-acab-bceca049a38e', '2024-09-02', NULL),
(41, 'c1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6', '0abe81d9-7991-11ef-acab-bceca049a38e', '2024-09-02', NULL),
(42, 'c1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6', '0abe81d9-7991-11ef-acab-bceca049a38e', '2024-09-03', NULL),
(43, 'c1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6', '227ca90c-7a49-11ef-a2e0-bceca049a38e', '2024-09-01', NULL),
(44, 'c1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6', '227ca90c-7a49-11ef-a2e0-bceca049a38e', '2024-09-02', NULL),
(45, 'c1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6', '227ca90c-7a49-11ef-a2e0-bceca049a38e', '2024-09-03', NULL);

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
('1e8d0f3e-3e6d-4a53-b8a6-6b9be0e3f49d', 'uday.kumar@innoverdigital.com', 'Uday Kumar'),
('a1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6p', 'shubham.kumawat@innoverdigital.com', 'Shubham Kumawat');

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
('1e8d0f3e-3e6d-4a53-b8a6-6b9be0e3f49d', '101e8d0f-3e6d-4a53-b8a6-6b9be0e3f49d'),
('1e8d0f3e-3e6d-4a53-b8a6-6b9be0e3f49d', '202e8d0f-3e6d-4a53-b8a6-6b9be0e3f49d'),
('1e8d0f3e-3e6d-4a53-b8a6-6b9be0e3f49d', '227ca90c-7a49-11ef-a2e0-bceca049a38e'),
('1e8d0f3e-3e6d-4a53-b8a6-6b9be0e3f49d', '303e8d0f-3e6d-4a53-b8a6-6b9be0e3f49d'),
('1e8d0f3e-3e6d-4a53-b8a6-6b9be0e3f49d', '38b831a8-797a-11ef-acab-bceca049a38e'),
('1e8d0f3e-3e6d-4a53-b8a6-6b9be0e3f49d', 'ca91795b-7779-11ef-b9e6-bceca049a38e');

-- --------------------------------------------------------

--
-- Table structure for table `project`
--

CREATE TABLE `project` (
  `ProjectID` char(36) NOT NULL,
  `Name` varchar(255) NOT NULL,
  `StartDate` varchar(10) DEFAULT NULL,
  `EndDate` varchar(10) DEFAULT NULL,
  `Status` int(11) NOT NULL,
  `TotalHours` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `project`
--

INSERT INTO `project` (`ProjectID`, `Name`, `StartDate`, `EndDate`, `Status`, `TotalHours`) VALUES
('0abe81d9-7991-11ef-acab-bceca049a38e', 'frontierxyz', '09/02/2024', '09/08/2024', NULL, NULL),
('101e8d0f-3e6d-4a53-b8a6-6b9be0e3f49d', 'Timesheet App Project', '09/02/2024', '09/08/2024', NULL, NULL),
('202e8d0f-3e6d-4a53-b8a6-6b9be0e3f49d', 'Client Onboarding', '09/02/2024', '09/08/2024', NULL, NULL),
('227ca90c-7a49-11ef-a2e0-bceca049a38e', 'innover', '09/02/2024', '09/08/2024', NULL, NULL),
('303e8d0f-3e6d-4a53-b8a6-6b9be0e3f49d', 'Frontier', '09/02/2024', '09/08/2024', NULL, NULL),
('38b831a8-797a-11ef-acab-bceca049a38e', 'Bluelink', '09/02/2024', '09/08/2024', NULL, NULL),
('ca91795b-7779-11ef-b9e6-bceca049a38e', 'White cap', '09/02/2024', '09/08/2024', NULL, NULL);

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
('c1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6', 'uday.kumar@innoverdigital.com', 'Employee One'),
('d1e2f3g4-h5i6-j7k8-l9m0-n1o2p3q4r5s6', 'employee2@innoverdigital.com', 'Employee Two');

-- --------------------------------------------------------

--
-- Table structure for table `resourceprojects`
--

CREATE TABLE `resourceprojects` (
  `ResourceID` char(36) NOT NULL,
  `ProjectID` char(36) NOT NULL,
  `Status` int(11) NOT NULL,
  `TotalHours` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `resourceprojects`
--

INSERT INTO `resourceprojects` (`ResourceID`, `ProjectID`, `Status`, `TotalHours`) VALUES
('c1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6', '0abe81d9-7991-11ef-acab-bceca049a38e', NULL, NULL),
('c1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6', '101e8d0f-3e6d-4a53-b8a6-6b9be0e3f49d', NULL, NULL),
('c1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6', '202e8d0f-3e6d-4a53-b8a6-6b9be0e3f49d', NULL, NULL),
('c1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6', '227ca90c-7a49-11ef-a2e0-bceca049a38e', NULL, NULL),
('c1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6', '303e8d0f-3e6d-4a53-b8a6-6b9be0e3f49d', NULL, NULL),
('c1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6', '38b831a8-797a-11ef-acab-bceca049a38e', NULL, NULL),
('c1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6', 'ca91795b-7779-11ef-b9e6-bceca049a38e', NULL, NULL),
('d1e2f3g4-h5i6-j7k8-l9m0-n1o2p3q4r5s6', '101e8d0f-3e6d-4a53-b8a6-6b9be0e3f49d', NULL, NULL),
('d1e2f3g4-h5i6-j7k8-l9m0-n1o2p3q4r5s6', '202e8d0f-3e6d-4a53-b8a6-6b9be0e3f49d', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `worked_hours`
--

CREATE TABLE `worked_hours` (
  `ID` int(11) NOT NULL,
  `ResourceID` varchar(255) DEFAULT NULL,
  `ProjectID` varchar(255) DEFAULT NULL,
  `Date` date DEFAULT NULL,
  `Hours` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `worked_hours`
--

INSERT INTO `worked_hours` (`ID`, `ResourceID`, `ProjectID`, `Date`, `Hours`) VALUES
(1, 'c1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6', '101e8d0f-3e6d-4a53-b8a6-6b9be0e3f49d', '2024-09-03', NULL),
(2, 'c1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6', '101e8d0f-3e6d-4a53-b8a6-6b9be0e3f49d', '2024-09-04', NULL),
(3, 'c1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6', '202e8d0f-3e6d-4a53-b8a6-6b9be0e3f49d', '2024-09-05', NULL),
(4, 'd1e2f3g4-h5i6-j7k8-l9m0-n1o2p3q4r5s6', '101e8d0f-3e6d-4a53-b8a6-6b9be0e3f49d', '2024-09-03', NULL),
(5, 'd1e2f3g4-h5i6-j7k8-l9m0-n1o2p3q4r5s6', '202e8d0f-3e6d-4a53-b8a6-6b9be0e3f49d', '2024-09-06', NULL);

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
-- Indexes for table `worked_hours`
--
ALTER TABLE `worked_hours`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `ResourceID` (`ResourceID`),
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
-- AUTO_INCREMENT for table `worked_hours`
--
ALTER TABLE `worked_hours`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

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
ALTER TABLE `worked_hours`
  ADD CONSTRAINT `worked_hours_ibfk_1` FOREIGN KEY (`ResourceID`) REFERENCES `resource` (`ResourceID`),
  ADD CONSTRAINT `worked_hours_ibfk_2` FOREIGN KEY (`ProjectID`) REFERENCES `project` (`ProjectID`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

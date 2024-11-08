-- Drop the `rms` database if it exists
DROP DATABASE IF EXISTS rms;

-- Create the `rms` database
CREATE DATABASE rms;

-- Use the `rms` database
USE rms;

-- -----------------------------------------------------
-- Table: Employees
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS Employees (
    EmployeeId VARCHAR(10) PRIMARY KEY,
    EmployeeName VARCHAR(255) NOT NULL,
    EmployeeRole VARCHAR(255),
    EmployeeEmail VARCHAR(255) UNIQUE NOT NULL,
    EmployeeStudio VARCHAR(255),
    EmployeeSubStudio VARCHAR(255),
    EmployeeLocation VARCHAR(255),
    EmployeeJoiningDate DATE NOT NULL,
    EmployeeEndingDate DATE,
    EmployeeSkills TEXT,
    EmployeeKekaStatus VARCHAR(255),
    EmployeeContractType VARCHAR(255),
    EmployeeTYOE INT,
    EmployeePhotoDetails VARCHAR(255)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Table: Clients
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS Clients (
    ClientID INT AUTO_INCREMENT PRIMARY KEY,
    ClientName VARCHAR(255) UNIQUE NOT NULL,
    ClientCountry VARCHAR(100),
    ClientPartner VARCHAR(100),
    ClientLogo VARCHAR(100)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Table: Projects
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS Projects (
    ProjectID INT AUTO_INCREMENT PRIMARY KEY,
    ProjectName VARCHAR(255) NOT NULL,
    ClientID INT,
    ProjectStatus VARCHAR(50),
    ProjectCategory VARCHAR(100),
    ProjectManagerID VARCHAR(10),
    ProjectManager VARCHAR(100),
    ProjectStartDate DATE NOT NULL,
    ProjectEndDate DATE,
    FOREIGN KEY (ClientID) REFERENCES Clients(ClientID)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    FOREIGN KEY (ProjectManagerID) REFERENCES Employees(EmployeeId)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Table: Allocations
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS Allocations (
    AllocationID INT AUTO_INCREMENT PRIMARY KEY,
    ClientID INT,
    ProjectID INT,
    EmployeeID VARCHAR(10),
    AllocationStatus ENUM('Client Unallocated', 'Project Unallocated', 'Allocated', 'Closed') NOT NULL,
    AllocationPercent INT NOT NULL CHECK (AllocationPercent BETWEEN 0 AND 100),
    AllocationBillingType VARCHAR(100),
    AllocationBilledCheck VARCHAR(100),
    AllocationBillingRate DECIMAL(10, 2),
    AllocationTimeSheetApproverID VARCHAR(10),
    AllocationTimeSheetApprover VARCHAR(100),
    AllocationStartDate DATE NOT NULL,
    AllocationEndDate DATE,
    ModifiedBy VARCHAR(100),
    ModifiedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ProjectID) REFERENCES Projects(ProjectID)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    FOREIGN KEY (ClientID) REFERENCES Clients(ClientID)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    FOREIGN KEY (EmployeeID) REFERENCES Employees(EmployeeId)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Table: Daily_Hours
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS Daily_Hours (
    GUIDID INT AUTO_INCREMENT PRIMARY KEY,
    AllocationID INT,
    WorkedDate DATE NOT NULL,
    WorkedDuration DECIMAL(5, 2) NOT NULL CHECK (WorkedDuration >= 0), -- Example: 8.5 hours
    EmployeeID VARCHAR(10),
    ProjectID INT,
    FOREIGN KEY (AllocationID) REFERENCES Allocations(AllocationID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (EmployeeID) REFERENCES Employees(EmployeeId)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (ProjectID) REFERENCES Projects(ProjectID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Table: Managers_View_Table
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS Managers_View_Table (
    GUIID INT AUTO_INCREMENT PRIMARY KEY,
    AllocationID INT,
    WeekStartDate DATE NOT NULL,
    WeekEndDate DATE NOT NULL,
    ManagersComments TEXT,
    EmployeeID VARCHAR(10),
    ProjectID INT,
    FOREIGN KEY (AllocationID) REFERENCES Allocations(AllocationID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (EmployeeID) REFERENCES Employees(EmployeeId)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (ProjectID) REFERENCES Projects(ProjectID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Insert Initial Data into Clients
-- -----------------------------------------------------
INSERT INTO Clients (ClientName, ClientCountry, ClientPartner, ClientLogo) VALUES
    ('Innover Digital.', 'USA', 'Rajendra', 'https://example.com/logos/tech_innovators.png'),
    ('Global Finance Corp.', 'Canada', 'Sudir', 'https://example.com/logos/global_finance.png'),
    ('HealthPlus Solutions', 'India', 'Stalin', 'https://example.com/logos/healthplus.png'),
    ('EcoGreen Enterprises', 'Germany', 'Jai', 'https://example.com/logos/ecogreen.png'),
    ('NextGen Media', 'Australia', 'Shetty', 'https://example.com/logos/nextgen_media.png'),
    ('Alpha Manufacturing', 'China', 'Nancy', 'https://example.com/logos/alpha_manufacturing.png'),
    ('Bright Future Education', 'UK', 'Paul', 'https://example.com/logos/bright_future.png'),
    ('Urban Developers', 'Singapore', 'Walker', 'https://example.com/logos/urban_developers.png'),
    ('Solaris Energy', 'Netherlands', 'Vin', 'https://example.com/logos/solaris_energy.png'),
    ('MediCare Partners', 'France', 'Diesel', 'https://example.com/logos/medicare_partners.png');

-- -----------------------------------------------------
-- Insert Initial Data into Employees
-- -----------------------------------------------------
INSERT INTO Employees (EmployeeId, EmployeeName, EmployeeRole, EmployeeEmail, EmployeeStudio, EmployeeSubStudio, EmployeeLocation, EmployeeJoiningDate, EmployeeEndingDate, EmployeeSkills, EmployeeKekaStatus, EmployeeContractType, EmployeeTYOE, EmployeePhotoDetails) VALUES
    ('INN001', 'Shubham Kumawat', 'Bizops', 'shubham.kumawat@innoverdigital.com', 'Data & Insights', 'Advanced Analytics', 'USA', '2018-06-15', NULL, 'Python, SQL, Tableau', 'Active', 'FTE', 6, NULL),
    ('INN002', 'Uday Kumar', 'Project Manager', 'uday.kumar@innoverdigital.com', 'Digital Operations', 'Software Engineering', 'India', '2020-01-10', NULL, 'Java, Spring Boot, AWS', 'Active', 'FTE', 4, NULL),
    ('INN003', 'Amair', 'Employee', 'amir.iqbal@innoverdigital.com', 'Data & Insights', 'Data Engineering', 'Canada', '2016-09-25', NULL, 'Scala, Hadoop, Kafka', 'Active', 'FTE', 7, NULL),
    ('INN004', 'Shiraz', 'Bizops', 'mohammed.khan@innoverdigital.com', 'Digital Experiences', 'Digital Ops', 'USA', '2019-03-05', NULL, 'Adobe XD, Sketch, User Research', 'Active', 'FTE', 5, NULL),
    ('INN005', 'Aakash', 'Employee', 'akash.babu@innoverdigital.com', 'Digital Operations', 'Digital Ops', 'India', '2015-11-20', NULL, 'Agile, Scrum, Leadership', 'Active', 'Contractor', 10, NULL),
    ('INN006', 'Chaitra', 'Employee', 'chaitra@innoverdigital.com', 'Data & Insights', 'Advanced Analytics', 'Canada', '2021-07-30', NULL, 'Excel, SQL, Power BI', 'Active', 'FTE', 3, NULL),
    ('INN007', 'Deepak', 'Bizops', 'deepak.bv@innoverdigital.com', 'Digital Operations', 'Software Engineering', 'USA', '2012-04-18', NULL, 'C++, Python, DevOps', 'Active', 'FTE', 12, NULL),
    ('INN008', 'Ashritha', 'Bizops', 'ashritha.ha@innoverdigital.com', 'Data & Insights', 'Advanced Analytics', 'India', '2017-02-22', NULL, 'Machine Learning, R, Python', 'Active', 'FTE', 5, NULL),
    ('INN009', 'Sanath', 'Leader', 'sanath.anantha@innoverdigital.com', 'Digital Experiences', 'Software Engineering', 'Canada', '2023-05-01', NULL, 'JavaScript, React, CSS', 'Active', 'FTE', 2, NULL),
    ('INN010', 'Srijyotee', 'Leader', 'srijyotee.mohanty@innoverdigital.com', 'Data & Insights', 'Data Engineering', 'USA', '2014-10-12', NULL, 'ETL, SQL, AWS', 'Active', 'Contractor', 8, NULL),
    ('INN011', 'Rajendra Biswal', 'Project Manager', 'Rajendra.biswal@innoverdigital.com', 'Digital Operations', 'Software Engineering', 'USA', '2019-10-15', NULL, 'Docker, Kubernetes, CI/CD', 'Active', 'FTE', 4, NULL),
    ('INN012', 'Kiran Kumar', 'Project Manager', 'kiran.susarla@innoverdigital.com', 'Data & Insights', 'Advanced Analytics', 'Canada', '2020-06-18', NULL, 'Python, SQL, Tableau', 'Active', 'FTE', 3, NULL),
    ('INN013', 'Sathiamurthi', 'Project Manager', 'sathiamurthi.mahalingam@innoverdigital.com', 'Digital Operations', 'Software Engineering', 'India', '2016-04-21', NULL, 'Java, SQL, AWS', 'Active', 'FTE', 8, NULL);

-- -----------------------------------------------------
-- Insert Initial Data into Projects
-- -----------------------------------------------------
INSERT INTO Projects (ProjectName, ClientID, ProjectStatus, ProjectCategory, ProjectManagerID, ProjectManager, ProjectStartDate, ProjectEndDate) VALUES
    ('Project Alpha', 1, 'Completed', 'Software Development', 'INN002', 'Uday Kumar', '2024-01-15', '2025-08-01'),
    ('Project Beta', 2, 'In Progress', 'IT Consulting', 'INN011', 'Rajendra Biswal', '2024-03-01', NULL),
    ('Project Gamma', 3, 'On Hold', 'Cloud Solutions', 'INN012', 'Kiran Kumar', '2024-05-20', NULL),
    ('Project Delta', 1, 'In Progress', 'Mobile App Development', 'INN013', 'Sathiamurthi', '2024-07-10', NULL),
    ('Project Epsilon', 4, 'Completed', 'Security Solutions', 'INN002', 'Uday Kumar', '2021-11-01', '2022-03-15'),
    ('Project Zeta', 1, 'Completed', 'Software Development', 'INN011', 'Rajendra Biswal', '2022-01-15', '2022-08-01'),
    ('Project Omni', 2, 'In Progress', 'IT Consulting', 'INN012', 'Kiran Kumar', '2024-03-01', NULL),
    ('Project Galaxy', 3, 'On Hold', 'Cloud Solutions', 'INN013', 'Sathiamurthi', '2024-05-20', NULL),
    ('Project Star', 1, 'In Progress', 'Mobile App Development', 'INN002', 'Uday Kumar', '2024-07-10', NULL),
    ('Project Peanuts', 4, 'Completed', 'Security Solutions', 'INN011', 'Rajendra Biswal', '2021-11-01', '2022-03-15');

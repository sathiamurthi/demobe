USE timesheet;
-- Disable foreign key checks
SET FOREIGN_KEY_CHECKS = 0;

-- Truncate tables in the correct order
TRUNCATE TABLE `daily_hours`;
TRUNCATE TABLE `resourceprojects`;
TRUNCATE TABLE `managerprojects`;
TRUNCATE TABLE `manager`;
TRUNCATE TABLE `project`;
TRUNCATE TABLE `resource`;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

USE timesheet;
-- Insert data from `rms.Employees` to `timesheet.resource`
INSERT INTO `timesheet`.`resource` (ResourceID, Name, Email)
SELECT 
    EmployeeId AS ResourceID, 
    EmployeeName AS Name, 
    EmployeeEmail AS Email
FROM `rms`.`Employees`;

-- First, ensure you are using the correct `timesheet` database
USE timesheet;

-- Insert data from `rms.Employees` to `timesheet.manager` for Project Managers only
INSERT INTO `timesheet`.`manager` (ManagerID, Email, Name)
SELECT 
    EmployeeId AS ManagerID, 
    EmployeeEmail AS Email, 
    EmployeeName AS Name
FROM `rms`.`Employees`
WHERE EmployeeRole = 'Project Manager';


-- Ensure you are using the `timesheet` database
USE timesheet;

-- Insert or update data in `timesheet.project`
INSERT INTO `timesheet`.`project` (ProjectID, Name, StartDate, EndDate, Status, TotalHours)
SELECT 
    a.AllocationID AS ProjectID,          -- Map AllocationID to ProjectID
    p.ProjectName AS Name,                -- Map associated ProjectName from Projects table to Name
    a.AllocationStartDate AS StartDate,   -- Use AllocationStartDate from Allocations
    a.AllocationEndDate AS EndDate,       -- Use AllocationEndDate from Allocations
    0 AS Status,                          -- Set Status to 0 as a placeholder
    0 AS TotalHours                       -- Set TotalHours to 0 as a placeholder
FROM 
    `rms`.`Allocations` a
JOIN 
    `rms`.`Projects` p ON a.ProjectID = p.ProjectID
WHERE 
    a.AllocationID IS NOT NULL            -- Ensure only valid AllocationID entries are considered
ON DUPLICATE KEY UPDATE 
    -- Only update fields if the combination of StartDate and EndDate is different
    StartDate = IF(VALUES(StartDate) <> StartDate, VALUES(StartDate), StartDate),
    EndDate = IF(VALUES(EndDate) <> EndDate, VALUES(EndDate), EndDate),
    Name = VALUES(Name);                  -- Update the Name as well in case of changes


-- Ensure you are using the `timesheet` database
USE timesheet;

-- Insert data into `managerprojects` table using `rms.Allocations`
REPLACE INTO `timesheet`.`managerprojects` (ManagerID, ProjectID)
SELECT DISTINCT
    a.AllocationTimeSheetApproverID COLLATE utf8mb4_general_ci AS ManagerID,  -- Standardize collation for ManagerID
    a.AllocationID COLLATE utf8mb4_general_ci AS ProjectID                    -- Standardize collation for ProjectID
FROM 
    `rms`.`Allocations` a
JOIN 
    `timesheet`.`manager` m 
    ON a.AllocationTimeSheetApproverID COLLATE utf8mb4_general_ci = m.ManagerID COLLATE utf8mb4_general_ci -- Ensure compatible collations for ManagerID
JOIN 
    `timesheet`.`project` p 
    ON a.AllocationID COLLATE utf8mb4_general_ci = p.ProjectID COLLATE utf8mb4_general_ci                 -- Ensure compatible collations for ProjectID
WHERE 
    a.AllocationTimeSheetApproverID IS NOT NULL   -- Ensure only valid ManagerID entries are considered
    AND a.AllocationID IS NOT NULL;               -- Ensure only valid ProjectID entries are considered

-- Ensure you are using the `timesheet` database
USE timesheet;

-- Insert data into `timesheet`.`resourceprojects` using `rms.Allocations`
REPLACE INTO `timesheet`.`resourceprojects` (ResourceID, ProjectID, Status, TotalHours, Comments, AssignedHours)
SELECT 
    a.EmployeeID AS ResourceID,                -- Map EmployeeID from `rms.Allocations` to ResourceID
    a.AllocationID AS ProjectID,               -- Map AllocationID from `rms.Allocations` to ProjectID
    0 AS Status,                               -- Set Status as 0 (you can adjust based on requirements)
    0 AS TotalHours,                           -- Set TotalHours as 0 (placeholder)
    NULL AS Comments,                          -- Set Comments to NULL (optional)
    CASE                                       
        WHEN a.AllocationPercent = 100 THEN 8   -- Map AllocationPercent to AssignedHours
        WHEN a.AllocationPercent = 75 THEN 6
        WHEN a.AllocationPercent = 50 THEN 4
        WHEN a.AllocationPercent = 25 THEN 2
        ELSE 0                                  -- For 0% or any other undefined values, set AssignedHours to 0
    END AS AssignedHours
FROM 
    `rms`.`Allocations` a
WHERE 
    a.EmployeeID IS NOT NULL                    -- Ensure valid EmployeeID entries
    AND a.AllocationID IS NOT NULL;             -- Ensure valid AllocationID entries

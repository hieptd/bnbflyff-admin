USE [LOGGING_01_DBF]
GO

-- Drop procedure if exists
IF OBJECT_ID('dbo.uspChangeGuildNameLog', 'P') IS NOT NULL
    DROP PROCEDURE dbo.uspChangeGuildNameLog;
GO

-- Drop tables if they already exist
IF OBJECT_ID('dbo.tblChangeGuildNameLog', 'U') IS NOT NULL
    DROP TABLE dbo.tblChangeGuildNameLog;
GO

IF OBJECT_ID('dbo.tblChangeGuildNameHistoryLog', 'U') IS NOT NULL
    DROP TABLE dbo.tblChangeGuildNameHistoryLog;
GO

-- Create tblChangeGuildNameLog
CREATE TABLE dbo.tblChangeGuildNameLog (
    ChangeID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    serverindex CHAR(2) NOT NULL,
    StartDt DATETIME NOT NULL,
    EndDt DATETIME NULL,
    idGuild INT NULL,
    GuildName VARCHAR(32) NOT NULL
);
GO

-- Create tblChangeGuildNameHistoryLog
CREATE TABLE dbo.tblChangeGuildNameHistoryLog (
    serverindex CHAR(2) NOT NULL,
    idGuild INT NULL,
    OldGuildName VARCHAR(32) NOT NULL,
    NewGuildName VARCHAR(32) NOT NULL,
    ChangeDt DATETIME NOT NULL
);
GO

-- Create stored procedure uspChangeGuildNameLog
CREATE PROCEDURE dbo.uspChangeGuildNameLog
    @pserverindex CHAR(2),
    @pidGuild INT,
    @pOldName VARCHAR(32),
    @pNewName VARCHAR(32)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @ChangeID INT;

    -- Insert into History Log
    INSERT INTO dbo.tblChangeGuildNameHistoryLog (serverindex, idGuild, OldGuildName, NewGuildName, ChangeDt)
    VALUES (@pserverindex, @pidGuild, @pOldName, @pNewName, GETDATE());

    IF @@ROWCOUNT = 0 RETURN;

    -- Get current active ChangeID for this guild
    SELECT @ChangeID = ChangeID FROM dbo.tblChangeGuildNameLog WHERE idGuild = @pidGuild AND EndDt IS NULL;

    IF @ChangeID IS NOT NULL
    BEGIN
        -- End the current log entry
        UPDATE dbo.tblChangeGuildNameLog
        SET EndDt = GETDATE()
        WHERE ChangeID = @ChangeID;
    END

    -- Insert new active entry
    INSERT INTO dbo.tblChangeGuildNameLog (serverindex, StartDt, EndDt, idGuild, GuildName)
    VALUES (@pserverindex, GETDATE(), NULL, @pidGuild, @pNewName);

    SET NOCOUNT OFF;
END
GO

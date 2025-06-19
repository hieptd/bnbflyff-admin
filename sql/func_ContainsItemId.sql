USE [CHARACTER_01_DBF]
GO

SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE FUNCTION [dbo].[ContainsItemId]
(
    @data NVARCHAR(MAX),
    @itemId INT
)
RETURNS BIT
AS
BEGIN
    DECLARE @pos INT = 1;
    DECLARE @nextPos INT;
    DECLARE @part NVARCHAR(4000);
    DECLARE @token NVARCHAR(4000);
    DECLARE @found BIT = 0;

    IF @data IS NULL RETURN 0;

    WHILE @pos <= LEN(@data)
    BEGIN
        SET @nextPos = CHARINDEX('/', @data, @pos);
        IF @nextPos = 0 SET @nextPos = LEN(@data) + 1;

        SET @part = SUBSTRING(@data, @pos, @nextPos - @pos);

        -- Get second value (itemId) in the segment
        IF CHARINDEX(',', @part) > 0
        BEGIN
            DECLARE @firstComma INT = CHARINDEX(',', @part);
            DECLARE @secondComma INT = CHARINDEX(',', @part, @firstComma + 1);

            IF @secondComma > @firstComma
            BEGIN
                SET @token = SUBSTRING(@part, @firstComma + 1, @secondComma - @firstComma - 1);
                IF TRY_CAST(@token AS INT) = @itemId
                BEGIN
                    SET @found = 1;
                    BREAK;
                END
            END
        END

        SET @pos = @nextPos + 1;
    END

    RETURN @found;
END
GO

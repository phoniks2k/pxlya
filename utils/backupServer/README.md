# Scripts and notes for backup (historical view) server

## backupSync.sh
shell script that can be launched with backup.js to sync to a storage server after every backup. It uses rsync which is much faster than ftp, sftp or any other methode.

## Notes

Historical view and backups are best to be stored on a different server.
Backups do generate lots of files. Every day one full backup is made with png files for every single file - and incremential backups all 15min into png files with just the changed pixels since the last full backup set.
If the filesystem has a limit on inodes, this is very likely to be hit within a year or so by the amount of small files.
The following scripts are to mitigate this and to decrease disk usage.

## hardlink.sh <daily-backup-folder-1> <daily-backup-folder-2>
Compares the full-backup tile files from one day to another and creates hardlinks on equal tiles, which significantly reduces the numbers of used inodes and disk space used.
This uses the hardlink_0.3 util from https://jak-linux.org/projects/hardlink/ which ships with current debian and ubuntu, but in a different version on other distributions.

## mksquashfs
Backups from a whole month can be archived into a mountable read-only image with sqashfs.
Squashfs compresses the data, including inodes and reolves all duplicates. However, when compressing it needs to parse all inodes, which takes lots of RAM (at least 256 bytes per inode - we got millions of files).
We use the arguments `-b 8192 -no-xattrs -no-exports -progress`, where no-export is neccessary in order to not hit memory limit when mounting multiple images.

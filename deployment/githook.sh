#!/bin/bash
# This hook builds pixelplanet after a push, and deploys it, it should be ron post-receive
# If it is the production branch, it will deploy it on the life system, and other branch will get deployed to the dev-canvas (a second canvas that is running on the server)
#
# To set up a server to use this, you have to go through the building steps manually first.
#
#folder for building the canvas (the git repository will get checkout there and the canvas will get buil thtere)
BUILDDIR="/home/pixelpla/pixelplanet-build"
#folder for dev canvas
DEVFOLDER="/home/pixelpla/pixelplanet-dev"
#folder for production canvas
PFOLDER="/home/pixelpla/pixelplanet"

should_reinstall () {
    local TMPFILE="${BUILDDIR}/package.json.${branch}.tmp"
    local NODEDIR="${BUILDDIR}/node_modules"
    local ORFILE="${BUILDDIR}/package.json"
    [ -f "${TMPFILE}" ] && [ -d "${NODEDIR}" ] && diff -q  "${TMPFILE}" "${ORFILE}" && {
        echo "package.json stil the same, no need to rerun npm install."
        return 1
    }
    cp "${ORFILE}" "${TMPFILE}"
    echo "package.json changed, need to run npm install."
    return 0
}

npm_reinstall () {
    rm -rf node_modules
    rm package-lock.json 
    npm install
}

while read oldrev newrev refname
do
    branch=$(git rev-parse --symbolic --abbrev-ref $refname)
    if [ "production" == "$branch" ]; then
        echo "---UPDATING REPO ON PRODUCTION SERVER---"
        GIT_WORK_TREE="$BUILDDIR" GIT_DIR="${BUILDDIR}/.git" git fetch --all
        GIT_WORK_TREE="$BUILDDIR" GIT_DIR="${BUILDDIR}/.git" git reset --hard origin/production
        COMMITS=`git log --pretty=format:'- %s%b' $newrev ^$oldrev`
        COMMITS=`echo "$COMMITS" | sed ':a;N;$!ba;s/\n/\\\n/g'`
        echo "---BUILDING pixelplanet---"
        cd "$BUILDDIR"
        should_reinstall
        DO_REINSTALL=$?
        [ $DO_REINSTALL -eq 0 ] && npm_reinstall
        npm run build
        echo "---RESTARTING CANVAS---"
        cp -r dist/*.js "${PFOLDER}/"
        cp -r dist/workers "${PFOLDER}/"
        rm -rf "${PFOLDER}/public/assets"
        cp -r dist/public "${PFOLDER}/"
        cp -r dist/captchaFonts "${PFOLDER}/"
        cp -r dist/package.json "${PFOLDER}/"
        cp -r dist/assets.json "${PFOLDER}/"
        cp -r dist/styleassets.json "${PFOLDER}/"
        mkdir -p "${PFOLDER}/log"
        cd "$PFOLDER"
        pm2 stop ppfun-server
        pm2 stop ppfun-backups
        pm2 stop ppfun-captchs
        [ $DO_REINSTALL -eq 0 ] && npm_reinstall
        pm2 start ecosystem.yml
        pm2 start ecosystem-backup.yml
       pm2 start ecosystem-captchas.yml
    else
        branch="dev"
        echo "---UPDATING REPO ON DEV SERVER---"
        pm2 stop ppfun-server-dev
        pm2 stop ppfun-captchas-dev
        GIT_WORK_TREE="$BUILDDIR" GIT_DIR="${BUILDDIR}/.git" git fetch --all
        GIT_WORK_TREE="$BUILDDIR" GIT_DIR="${BUILDDIR}/.git" git reset --hard "origin/$branch"
        COMMITS=`git log --pretty=format:'- %s%b' $newrev ^$oldrev`
        COMMITS=`echo "$COMMITS" | sed ':a;N;$!ba;s/\n/\\\n/g'`
        echo "---BUILDING pixelplanet---"
        cd "$BUILDDIR"
        should_reinstall
        DO_REINSTALL=$?
        [ $DO_REINSTALL -eq 0 ] && npm_reinstall
        nice -n 19 npm run build:dev
        echo "---RESTARTING CANVAS---"
        cp -r dist/*.js "${DEVFOLDER}/"
        cp -r dist/workers "${DEVFOLDER}/"
        rm -rf "${DEVFOLDER}/public/assets"
        cp -r dist/public "${DEVFOLDER}/"
        cp -r dist/captchaFonts "${DEVFOLDER}/"
        cp -r dist/package.json "${DEVFOLDER}/"
        cp -r dist/assets.json "${DEVFOLDER}/"
        cp -r dist/styleassets.json "${DEVFOLDER}/"
        mkdir -p "${PFOLDER}/log"
        cd "$DEVFOLDER"
        [ $DO_REINSTALL -eq 0 ] && npm_reinstall
        pm2 start ecosystem.yml
        pm2 start ecosystem-captchas.yml
    fi
done

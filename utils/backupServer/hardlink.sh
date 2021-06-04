 #!/bin/bash
DIR=$1
PREV_DIR=$2

echo "---Resolve duplicates to hardlinks---"
for CAN_DIR in `ls ${DIR}`; do
        if [ -d "${DIR}/${CAN_DIR}/tiles" ] && [ -d "${PREV_DIR}/${CAN_DIR}/tiles" ]; then
                for COL in `ls ${DIR}/${CAN_DIR}/tiles`; do
                        WDIR="${CAN_DIR}/tiles/${COL}"
                        echo "----${CAN_DIR} / ${COL}----"
                        if [ -d "${DIR}/${WDIR}" ] && [ -d "${PREV_DIR}/${WDIR}" ]; then
                                echo /usr/bin/hardlink --respect-name --ignore-time --ignore-owner "${DIR}/${WDIR}" "${PREV_DIR}/${WDIR}"
                                /usr/bin/hardlink --respect-name --ignore-time --ignore-owner --maximize "${DIR}/${WDIR}" "${PREV_DIR}/${WDIR}"
                        fi
                done
        fi
done
